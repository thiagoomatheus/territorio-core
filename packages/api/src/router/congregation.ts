import { z } from "zod";
import { authenticatedProcedure, protectedProcedure, router } from "../trpc";
import { congregations, users, territories, managers, assignments } from "@territorio/db/schema";
import { eq } from "drizzle-orm";
import { sign } from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

const CongregationSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    number: z.number(),
    whatsappInstanceName: z.string().nullable(),
    whatsappApiKey: z.string().nullable(),
    whatsappGroupId: z.string().nullable(),
    setupStep: z.number(),
    createdAt: z.date().nullable(),
});

const CheckAvailabilityResponse = z.object({
    status: z.enum(['AVAILABLE', 'OCCUPIED', 'ABANDONED']),
    message: z.string().optional(),
    ownerEmail: z.string().nullable().optional(),
    hasData: z.boolean().optional(),
    congregationId: z.uuid().optional(),
    name: z.string().optional(),
});

export const congregationRouter = router({
    checkAvailability: authenticatedProcedure
        .input(z.object({ number: z.number() }))
        .output(CheckAvailabilityResponse)
        .query(async ({ ctx, input }) => {
            const targetCongregation = await ctx.db.query.congregations.findFirst({
                where: eq(congregations.number, input.number),
                with: { users: true, territories: true }
            });

            if (!targetCongregation) return { status: 'AVAILABLE', message: 'Disponível para criação' };

            if (targetCongregation.users.length > 0) {
                return { 
                    status: 'OCCUPIED', 
                    message: 'Já possui administrador',
                    ownerEmail: targetCongregation.users[0].email 
                };
            }

            return { 
                status: 'ABANDONED',
                message: 'Congregação sem administrador',
                hasData: targetCongregation.territories.length > 0,
                congregationId: targetCongregation.id,
                name: targetCongregation.name
            };
        }),

    switch: authenticatedProcedure
        .input(z.object({
            number: z.number(),
            name: z.string().optional(),
            action: z.enum(['CREATE_NEW', 'CLAIM_EXISTING', 'CLAIM_AND_WIPE']),
            targetCongregationId: z.uuid().optional(),
        }))
        .output(z.object({ newToken: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.transaction(async (tx) => {
            let newCongregationId = input.targetCongregationId;

            if (input.action === 'CREATE_NEW') {
                if (!input.name) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nome obrigatório' });

                const exists = await tx.query.congregations.findFirst({
                    where: eq(congregations.number, input.number)
                });
                if (exists) throw new TRPCError({ code: 'CONFLICT', message: 'Número já existe' });

                const [newCongregation] = await tx.insert(congregations).values({
                    name: input.name,
                    number: input.number,
                    setupStep: 1
                }).returning();
                newCongregationId = newCongregation.id;
            }

            if (input.action === 'CLAIM_AND_WIPE') {
                if (!newCongregationId) throw new TRPCError({ code: 'BAD_REQUEST' });
                await tx.delete(assignments).where(eq(assignments.congregationId, newCongregationId));
                await tx.delete(territories).where(eq(territories.congregationId, newCongregationId));
                await tx.delete(managers).where(eq(managers.congregationId, newCongregationId));
            }

            if (!newCongregationId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

            await tx.update(users)
                .set({ congregationId: newCongregationId, role: 'owner' })
                .where(eq(users.id, ctx.user!.id));

            const newToken = sign(
                { userId: ctx.user!.id, congregationId: newCongregationId, role: 'owner' },
                JWT_SECRET, { expiresIn: '7d' }
            );

            return { newToken };
            });
        }),

    update: protectedProcedure
        .input(z.object({
            name: z.string().optional(),
            whatsappInstanceName: z.string().optional(),
            whatsappApiKey: z.string().optional(),
            whatsappGroupId: z.string().optional(),
            setupStep: z.number().optional()
        }))
        .output(CongregationSchema)
        .mutation(async ({ ctx, input }) => {
            const [updated] = await ctx.db.update(congregations)
                .set(input)
                .where(eq(congregations.id, ctx.user.congregationId))
                .returning();
            return updated;
        }),
        
    get: protectedProcedure
        .output(CongregationSchema.nullable())
        .query(async ({ ctx }) => {
            const congregation = await ctx.db.query.congregations.findFirst({
                where: eq(congregations.id, ctx.user.congregationId)
            });
            return congregation || null;
        })
});