import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { managers } from "@territorio/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
        status: z.string(),
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

            const [newManager] = await ctx.db.insert(managers).values({
                congregationId: ctx.user.congregationId,
                name: input.name,
                phone: input.phone,
                active: true
            }).returning();

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
            const [updated] = await ctx.db.update(managers)
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

            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
            return updated;
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
        .output(ManagerWhithAssignmentsSchema)
        .query(async ({ ctx, input }) => {
            return await ctx.db.query.managers.findFirst({
                where: and(
                    eq(managers.id, input.id),
                    eq(managers.congregationId, ctx.user.congregationId)
                ),
                with: {
                    assignments: true
                }
            });
    })
});