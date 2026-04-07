import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { congregations, managers } from "@territorio/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendTextMessage, updateGroupParticipants } from "../services/evolution";
import { env } from "../env";

const TERRITORY_COMAND = env.COMANDO_SOLICITAR_TERRITORIO
const RETURN_COMAND = env.COMANDO_DEVOLVER_TERRITORIO

const ManagerSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    phone: z.string(),
    active: z.boolean().nullable(),
    createdAt: z.date().nullable(),
});

const ManagerWhithAssignmentsSchema = ManagerSchema.extend({
    assignments: z.array(z.object({
        id: z.string(),
        congregationId: z.string(),
        territoryId: z.string(),
        managerId: z.string(),
        status: z.enum(['ativo', 'concluido', 'cancelado']).nullable(),
        startedAt: z.date().nullable(),
        finishedAt: z.date().nullable(),
    }))
});

export const managersRouter = router({
    
    list: protectedProcedure
        .input(z.object({
            search: z.string().optional(),
            onlyActive: z.boolean().default(true)
        }).optional())
        .output(z.array(ManagerSchema))
        .query(async ({ ctx, input }) => {
        
            const whereFilters = [eq(managers.congregationId, ctx.user.congregationId)];
            
            if (input?.onlyActive) {
                whereFilters.push(eq(managers.active, true));
            }

            return await ctx.db.query.managers.findMany({
                where: and(...whereFilters),
                orderBy: [asc(managers.name)],
            });
    }),
    
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(2),
            phone: z.string().min(10).regex(/^\d+$/, "Apenas números"),
        }))
        .output(ManagerSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.managers.findFirst({
                where: and(
                    eq(managers.phone, input.phone),
                    eq(managers.congregationId, ctx.user.congregationId)
                )
            });

            if (existing) {
                throw new TRPCError({ code: 'CONFLICT', message: 'Telefone já cadastrado para outro dirigente.' });
            }

            const cong = await ctx.db.query.congregations.findFirst({
                where: eq(congregations.id, ctx.user.congregationId)
            });

            const [newManager] = await ctx.db.insert(managers).values({
                congregationId: ctx.user.congregationId,
                name: input.name,
                phone: input.phone,
                active: true
            }).returning();

            if (cong?.whatsappInstanceName && cong?.whatsappGroupId) {
                try {
                    await updateGroupParticipants({
                        instanceName: cong.whatsappInstanceName,
                        groupJid: cong.whatsappGroupId,
                        participants: [`${input.phone}@s.whatsapp.net`],
                        action: "add"
                    });
                    console.log(`📡 Comando enviado para adicionar ${input.phone} ao grupo.`);

                    await sendTextMessage({
                        instanceName: cong.whatsappInstanceName,
                        remoteJid: `${input.phone}@s.whatsapp.net`,
                        text: `Olá ${input.name}! Você foi adicionado como dirigente no sistema de territórios. Digite ${TERRITORY_COMAND} no grupo para solicitar um território ou ${RETURN_COMAND} para devolver um território.`
                    });
                } catch (e) {
                    console.error("Falha ao adicionar participante via API", e);
                }
            }

            return newManager;
    }),
    
    update: protectedProcedure
        .input(z.object({
            id: z.uuid(),
            name: z.string().optional(),
            phone: z.string().optional(),
            active: z.boolean().optional(),
        }))
        .output(ManagerSchema)
        .mutation(async ({ ctx, input }) => {
            const oldManager = await ctx.db.query.managers.findFirst({
            where: eq(managers.id, input.id)
        });

        if (!oldManager) throw new TRPCError({ code: 'NOT_FOUND' });
        
        const [updatedManager] = await ctx.db.update(managers)
            .set({
                name: input.name,
                phone: input.phone,
                active: input.active
            })
            .where(and(
                eq(managers.id, input.id),
                eq(managers.congregationId, ctx.user.congregationId)
            ))
            .returning();

        // 3. LÓGICA DE SINCRONIZAÇÃO WHATSAPP
        // Só dispara se o campo 'active' foi enviado no input E ele é diferente do que estava no banco
        const statusChanged = input.active !== undefined && input.active !== oldManager.active;

        if (statusChanged) {
            // Busca dados da congregação
            const cong = await ctx.db.query.congregations.findFirst({
                where: eq(congregations.id, ctx.user.congregationId)
            });

            if (cong?.whatsappInstanceName && cong?.whatsappGroupId) {
                try {
                    await updateGroupParticipants({
                        instanceName: cong.whatsappInstanceName,
                        groupJid: cong.whatsappGroupId,
                        participants: [`${updatedManager.phone}@s.whatsapp.net`],
                        action: updatedManager.active ? "add" : "remove"
                    });
                    console.log(`📡 Sincronização automática: ${updatedManager.name} foi ${updatedManager.active ? 'adicionado' : 'removido'} do grupo.`);
                } catch (e) {
                    console.error("⚠️ Falha na sincronização com WhatsApp no update:", e);
                }
            }
        }

        return updatedManager;
    }),
    
    toggleActive: protectedProcedure
        .input(z.object({ id: z.uuid(), active: z.boolean() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(managers)
                .set({ active: input.active })
                .where(and(
                    eq(managers.id, input.id),
                    eq(managers.congregationId, ctx.user.congregationId)
                ));
            return { success: true };
    }),
    
    byId: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .output(ManagerWhithAssignmentsSchema.nullable())
        .query(async ({ ctx, input }) => {
            const manager = await ctx.db.query.managers.findFirst({
                where: and(
                    eq(managers.id, input.id),
                    eq(managers.congregationId, ctx.user.congregationId)
                ),
                with: {
                    assignments: true
                }
            });

            return manager || null;
    })
});