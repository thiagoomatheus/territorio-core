import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { congregations } from "@territorio/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { BASE_URL, createGroup, fetchContacts, fetchGroupInviteLink } from "../services/evolution";
import axios from "axios";

export const whatsappRouter = router({
    
    getContacts: protectedProcedure.query(async ({ ctx }) => {
        const cong = await ctx.db.query.congregations.findFirst({
            where: eq(congregations.id, ctx.user.congregationId)
        });

        if (!cong || !cong.whatsappInstanceName || !cong.whatsappApiKey) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'WhatsApp não conectado.' });
        }

        const contacts = await fetchContacts({
            instanceName: cong.whatsappInstanceName,
            apiKey: cong.whatsappApiKey
        });

        if (!Array.isArray(contacts)) return [];
        
        return contacts
            .filter((c: any) => c.id.includes('@s.whatsapp.net'))
            .map((c: any) => ({
                id: c.id.split('@')[0],
                name: c.name || c.pushName || c.id.split('@')[0],
                picture: c.pictureUrl || null
            }));
    }),
  
    createGroup: protectedProcedure
    .input(z.object({
        name: z.string().min(3),
        participants: z.array(z.string()).min(1, "Selecione pelo menos 1 participante"), 
    }))
    .mutation(async ({ ctx, input }) => {
        const cong = await ctx.db.query.congregations.findFirst({
            where: eq(congregations.id, ctx.user.congregationId)
        });

        if (!cong || !cong.whatsappInstanceName || !cong.whatsappApiKey) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'WhatsApp não conectado.' });
        }
        
        const result = await createGroup({
            instanceName: cong.whatsappInstanceName,
            apiKey: cong.whatsappApiKey,
            groupName: input.name,
            participants: input.participants
        });
        
        const groupId = result.response?.id || result.id; 

        if (!groupId) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Grupo criado mas ID não retornado.' });
        }
        
        await ctx.db.update(congregations)
            .set({ 
                whatsappGroupId: groupId,
                setupStep: 3
            })
            .where(eq(congregations.id, cong.id));
            
        const inviteLink = await fetchGroupInviteLink({
            instanceName: cong.whatsappInstanceName,
            apiKey: cong.whatsappApiKey,
            groupId: groupId
        });

        return { 
            success: true, 
            groupId, 
            groupName: input.name,
            inviteLink
        };
    }),

});