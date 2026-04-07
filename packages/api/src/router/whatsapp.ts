import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { congregations, managers } from "@territorio/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { connectInstance, createGroup, createInstance, fetchContacts, fetchGroupInfo, fetchGroupInviteLink, fetchGroups, getStatusInstance } from "../services/evolution";

const cleanPhone = (jid: string) => jid.split('@')[0];

export const whatsappRouter = router({
    
    getContacts: protectedProcedure
    .output(z.array(z.object({
        id: z.string(),
        name: z.string().nullable(),
        picture: z.string().nullable()
    })))
    .query(async ({ ctx }) => {
        const cong = await ctx.db.query.congregations.findFirst({
            where: eq(congregations.id, ctx.user.congregationId)
        });

        if (!cong || !cong.whatsappInstanceName) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'WhatsApp não conectado.' });
        }

        const contacts = await fetchContacts({
            instanceName: cong.whatsappInstanceName,
        });

        if (!Array.isArray(contacts)) return [];
        
        return contacts
            .filter((c) => c.id.includes('@s.whatsapp.net'))
            .map((c) => ({
                id: c.id.split('@')[0],
                name: c.pushName,
                picture: c.profilePicUrl || null
            }));
    }),
  
    createGroup: protectedProcedure
    .input(z.object({
        name: z.string().min(3),
        participants: z.array(z.string()).min(1, "Selecione pelo menos 1 participante"), 
    }))
    .output(z.object({
        success: z.boolean(),
        groupId: z.string(),
        groupName: z.string(),
        inviteLink: z.string().nullable()
    }))
    .mutation(async ({ ctx, input }) => {
        const cong = await ctx.db.query.congregations.findFirst({
            where: eq(congregations.id, ctx.user.congregationId)
        });

        if (!cong || !cong.whatsappInstanceName) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'WhatsApp não conectado.' });
        }
        
        const result = await createGroup({
            instanceName: cong.whatsappInstanceName,
            groupName: input.name,
            participants: input.participants
        });
        
        const groupId = result.id;

        if (!groupId) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Grupo criado mas ID não retornado.' });
        }

        await ctx.db.transaction(async (tx) => {
            await ctx.db.update(congregations)
                .set({ 
                    whatsappGroupId: groupId,
                    setupStep: 3
                })
                .where(eq(congregations.id, cong.id));

            for (const participantJid of input.participants) {
                const existing = await tx.query.managers.findFirst({
                    where: eq(managers.phone, cleanPhone(participantJid))
                });

                if (!existing) {
                    await tx.insert(managers).values({
                        congregationId: cong.id,
                        name: cleanPhone(participantJid),
                        phone: cleanPhone(participantJid),
                        active: true
                    });
                }
            }

        });
        
            
        const inviteLink = await fetchGroupInviteLink({
            instanceName: cong.whatsappInstanceName,
            groupId: groupId
        });

        return { 
            success: true, 
            groupId, 
            groupName: input.name,
            inviteLink
        };
    }),

    selectGroup: protectedProcedure
    .input(z.object({
        groupId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
        const cong = await ctx.db.query.congregations.findFirst({
            where: eq(congregations.id, ctx.user.congregationId)
        });

        if (!cong || !cong.whatsappInstanceName) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'WhatsApp não conectado.' });
        }

        const groupInfo = await fetchGroupInfo({
            instanceName: cong.whatsappInstanceName,
            groupJid: input.groupId
        });

        if (!groupInfo || !groupInfo.participants) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Não foi possível ler os participantes do grupo.' });
        }

        await ctx.db.transaction(async (tx) => {
            
            await tx.update(congregations)
                .set({ whatsappGroupId: input.groupId, setupStep: 3 })
                .where(eq(congregations.id, cong.id));
                
            for (const p of groupInfo.participants) {
                
                const phone = cleanPhone(p.id);
                
                const existing = await tx.query.managers.findFirst({
                    where: eq(managers.phone, phone)
                });

                if (!existing) {
                    
                    await tx.insert(managers).values({
                        congregationId: cong.id,
                        name: phone, 
                        phone: phone,
                        active: true
                    });
                }
            }
        });

        return { success: true, importedCount: groupInfo.participants.length };
    }),

    connect: protectedProcedure
    .output(z.object({
        status: z.enum(['connected', 'waiting_scan', 'error']),
        qrcode: z.string().nullable(),
        pairingCode: z.string().nullable()
    }))
    .mutation(async ({ ctx }) => {
        const cong = await ctx.db.query.congregations.findFirst({
            where: eq(congregations.id, ctx.user.congregationId)
        });
        if (!cong) throw new TRPCError({ code: 'NOT_FOUND' });

        if (cong.whatsappInstanceName) {
            try {
                const responseGetStatus = await getStatusInstance({
                    instanceName: cong.whatsappInstanceName,
                });

                const status = responseGetStatus.instance.state;
                
                if (status === 'open') {
                    return { status: 'connected', qrcode: null, pairingCode: null };
                }

                const responseConnect = await connectInstance({
                    instanceName: cong.whatsappInstanceName,
                });

                return { 
                    status: responseConnect.base64 ? 'waiting_scan' : 'connected',
                    qrcode: responseConnect.base64 || null,
                    pairingCode: responseConnect.pairingCode || null
                };

            } catch (error) {
                console.log("Instância não encontrada na Evolution, recriando...");
            }
        }
        
        const resultCreate = await createInstance({
            instanceName: cong.whatsappInstanceName || `org_${cong.id}`
        });

        if (!resultCreate.instance.instanceId) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao criar instância do WhatsApp.' });
        }

        if (!cong.whatsappInstanceName) {
            await ctx.db.update(congregations)
            .set({ whatsappInstanceName: resultCreate.instance.instanceName })
            .where(eq(congregations.id, cong.id));
        }

        const resultConnection = await connectInstance({
            instanceName: resultCreate.instance.instanceName
        });

        return {
            status: resultConnection.base64 ? 'waiting_scan' : 'connected',
            qrcode: resultConnection.base64 || null,
            pairingCode: resultConnection.pairingCode || null
        };
    }),

    getGroups: protectedProcedure
    .output(z.array(z.object({
        id: z.string(),
        subject: z.string(),
        size: z.number()
    })))
    .query(async ({ ctx }) => {
        const cong = await ctx.db.query.congregations.findFirst({
            where: eq(congregations.id, ctx.user.congregationId)
        });
        if (!cong || !cong.whatsappInstanceName) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'WhatsApp não conectado.' });
        }

        const groups = await fetchGroups({
            instanceName: cong.whatsappInstanceName!
        });

        return groups.map((g) => ({
            id: g.id,
            subject: g.subject,
            size: g.size
        }));
    }),

});