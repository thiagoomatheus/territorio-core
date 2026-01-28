import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { users } from "@territorio/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";

const SuccessMessageSchema = z.object({
  message: z.string(),
});

export const teamRouter = router({
    
    inviteAdmin: protectedProcedure
        .input(z.object({ 
            email: z.email(), 
            name: z.string(), 
            initialPassword: z.string().min(6) 
        }))
        .output(SuccessMessageSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.users.findFirst({
                where: eq(users.email, input.email)
            });

            if (existing) {
                if (existing.congregationId) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'Usuário já pertence a outra congregação.' });
                }
                await ctx.db.update(users)
                .set({ congregationId: ctx.user.congregationId, role: 'admin' })
                .where(eq(users.id, existing.id));
                return { message: 'Usuário existente adicionado à equipe.' };
            }

            const passwordHash = await hash(input.initialPassword, 10);
            await ctx.db.insert(users).values({
                name: input.name,
                email: input.email,
                password: passwordHash,
                congregationId: ctx.user.congregationId,
                role: 'admin'
            });
            return { message: 'Novo administrador criado.' };
        }),

    leaveCongregation: protectedProcedure
        .output(SuccessMessageSchema)
        .mutation(async ({ ctx }) => {
            const others = await ctx.db.query.users.findMany({
                where: and(
                    eq(users.congregationId, ctx.user.congregationId),
                    ne(users.id, ctx.user.id)
                )
            });

            if (others.length === 0) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Você é o único admin. Adicione outro antes de sair.' });
            }

            await ctx.db.update(users)
                .set({ congregationId: null, role: null })
                .where(eq(users.id, ctx.user.id));

            return { message: 'Saiu com sucesso.' };
        }),
});