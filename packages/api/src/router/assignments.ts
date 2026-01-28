import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { assignments, territories, managers } from "@territorio/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const AssignmentListSchema = z.object({
  id: z.uuid(),
  status: z.enum(['ativo', 'concluido', 'cancelado']),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  territory: z.object({
    id: z.uuid(),
    name: z.string(),
    status: z.string(),
    number: z.number(),
    blocks: z.union([z.array(z.array(z.string())), z.null()]).transform(val => 
      typeof val === 'string' ? JSON.parse(val) : val
    ),
    type: z.enum(['rural', 'comercial', 'urbano']).nullable(),
    imageUrl: z.string().nullable(),
    obs: z.string().nullable(),
    lastWorkedAt: z.date().nullable(),
    createdAt: z.date(),
  }),
  manager: z.object({
    id: z.uuid(),
    name: z.string(),
    phone: z.string(),
    active: z.boolean(),
    createdAt: z.date(),
  }),
});

const SimpleSuccessResponse = z.object({
  message: z.string(),
  assignmentId: z.uuid(),
});

export const assignmentRouter = router({
    
    assign: protectedProcedure
        .input(z.object({
            territoryId: z.uuid(),
            managerId: z.uuid(),
        }))
        .output(SimpleSuccessResponse)
        .mutation(async ({ ctx, input }) => {
        
            return await ctx.db.transaction(async (tx) => {
                
                const territory = await tx.query.territories.findFirst({
                    where: and(
                        eq(territories.id, input.territoryId),
                        eq(territories.congregationId, ctx.user.congregationId)
                    )
                });

                if (!territory) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Território não encontrado.' });
                }

                if (territory.status === 'trabalhando') {
                    throw new TRPCError({ code: 'CONFLICT', message: 'Este território já está sendo trabalhado.' });
                }
                
                const manager = await tx.query.managers.findFirst({
                    where: and(
                        eq(managers.id, input.managerId),
                        eq(managers.congregationId, ctx.user.congregationId)
                    )
                });

                if (!manager) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Dirigente não encontrado.' });
                }
                
                const activeAssignment = await tx.query.assignments.findFirst({
                    where: and(
                        eq(assignments.managerId, input.managerId),
                        eq(assignments.status, 'ativo')
                    )
                });

                if (activeAssignment) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'O dirigente já possui uma designação ativa.' });
                }
                
                const [newAssignment] = await tx.insert(assignments).values({
                    congregationId: ctx.user.congregationId,
                    territoryId: input.territoryId,
                    managerId: input.managerId,
                    status: 'ativo',
                    startedAt: new Date(),
                }).returning();
                
                await tx.update(territories)
                .set({ status: 'trabalhando' })
                .where(eq(territories.id, input.territoryId));

                return { message: 'Território atribuído com sucesso.', assignmentId: newAssignment.id };
            });
    }),
    
    complete: protectedProcedure
        .input(z.object({
            assignmentId: z.uuid(),
        }))
        .output(SimpleSuccessResponse)
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.transaction(async (tx) => {
                
                const assignment = await tx.query.assignments.findFirst({
                    where: and(
                        eq(assignments.id, input.assignmentId),
                        eq(assignments.congregationId, ctx.user.congregationId)
                    )
                });

                if (!assignment || assignment.status !== 'ativo') {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Designação não encontrada ou já finalizada.' });
                }
                
                await tx.update(assignments)
                .set({ 
                    status: 'concluido',
                    finishedAt: new Date()
                })
                .where(eq(assignments.id, input.assignmentId));
                
                await tx.update(territories)
                .set({ 
                    status: 'disponivel',
                    lastWorkedAt: new Date()
                })
                .where(eq(territories.id, assignment.territoryId));

                return { message: 'Território devolvido.', assignmentId: input.assignmentId };
            });
    }),
    
    revoke: protectedProcedure
        .input(z.object({
            assignmentId: z.uuid(),
        }))
        .output(SimpleSuccessResponse)
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.transaction(async (tx) => {
                const assignment = await tx.query.assignments.findFirst({
                    where: and(
                        eq(assignments.id, input.assignmentId),
                        eq(assignments.congregationId, ctx.user.congregationId)
                    )
                });

                if (!assignment) throw new TRPCError({ code: 'NOT_FOUND' });
                
                await tx.update(assignments)
                .set({ status: 'cancelado', finishedAt: new Date() })
                .where(eq(assignments.id, input.assignmentId));
                
                await tx.update(territories)
                .set({ status: 'disponivel' })
                .where(eq(territories.id, assignment.territoryId));

                return { message: 'Designação cancelada.', assignmentId: input.assignmentId };
            });
    }),
    
    list: protectedProcedure
        .input(z.object({
            filter: z.enum(['active', 'history']).default('active'),
            limit: z.number().min(1).max(100).default(20),
        }))
        .output(z.array(AssignmentListSchema))
        .query(async ({ ctx, input }) => {
        
            const whereCondition = input.filter === 'active'
                ? and(
                    eq(assignments.congregationId, ctx.user.congregationId),
                    eq(assignments.status, 'ativo')
                )
                : and(
                    eq(assignments.congregationId, ctx.user.congregationId),
                );

            const assignmentsFiltered = await ctx.db.query.assignments.findMany({
                where: whereCondition,
                orderBy: [desc(assignments.startedAt)],
                limit: input.limit,
                with: {
                    territory: true,
                    manager: true,
                }
            });

            return assignmentsFiltered.map(a => ({
                id: a.id,
                status: a.status,
                startedAt: a.startedAt,
                finishedAt: a.finishedAt,
                territory: {
                    ...a.territory,
                    blocks: typeof a.territory.blocks === 'string' ? JSON.parse(a.territory.blocks) : a.territory.blocks,
                },
                manager: a.manager,
            }));
    }),
});