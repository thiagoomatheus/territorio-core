import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { territories, assignments } from "@territorio/db/schema";
import { eq, and, sql, desc, lt } from "drizzle-orm";

// Schemas auxiliares para as listas
const AssignmentItemSchema = z.object({
    id: z.string(),
    startedAt: z.date().nullable(),
    finishedAt: z.date().nullable(),
    territory: z.object({ name: z.string(), number: z.number() }),
    manager: z.object({ name: z.string() }).nullable(),
});

const TerritoryItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    number: z.number(),
    lastWorkedAt: z.date().nullable(),
});

export const dashboardRouter = router({
  
    getStats: protectedProcedure
    .output(z.object({
        counts: z.object({
            total: z.number(),
            active: z.number(),
            overdue: z.number(),
        }),
        recentReturns: z.array(AssignmentItemSchema),
        recentTaken: z.array(AssignmentItemSchema),
        staleTerritories: z.array(TerritoryItemSchema),
    }))
    .query(async ({ ctx }) => {
        const congId = ctx.user.congregationId;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Total de Territórios
        const [totalRes] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(territories)
            .where(eq(territories.congregationId, congId));

        // Em Campo (Ativos)
        const [activeRes] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(assignments)
            .where(and(
                eq(assignments.congregationId, congId),
                eq(assignments.status, 'ativo')
            ));

        // Atrasados (> 30 dias)
        const [overdueRes] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(assignments)
            .where(and(
                eq(assignments.congregationId, congId),
                eq(assignments.status, 'ativo'),
                lt(assignments.startedAt, thirtyDaysAgo)
            ));

        // Últimos Devolvidos (Concluídos recentemente)
        const recentReturns = await ctx.db.query.assignments.findMany({
            where: and(
                eq(assignments.congregationId, congId),
                eq(assignments.status, 'concluido')
            ),
            orderBy: [desc(assignments.finishedAt)],
            limit: 5,
            with: {
                territory: { columns: { name: true, number: true } },
                manager: { columns: { name: true } }
            }
        });

        const recentTaken = await ctx.db.query.assignments.findMany({
            where: and(
                eq(assignments.congregationId, congId),
                eq(assignments.status, 'ativo')
            ),
            orderBy: [desc(assignments.startedAt)],
            limit: 5,
            with: {
                territory: { columns: { name: true, number: true } },
                manager: { columns: { name: true } }
            }
        });

        // Territórios "Esquecidos" (Disponíveis ordenados pela data mais antiga)
        // Usamos asc(lastWorkedAt). 
        // Nota: Postgres por padrão coloca NULL (nunca trabalhados) no final com ASC.
        // Se quiser NULLS FIRST, precisaria de sql raw, mas ASC simples já ajuda a ver os antigos.
        const staleTerritories = await ctx.db.query.territories.findMany({
            where: and(
                eq(territories.congregationId, congId),
                eq(territories.status, 'disponivel')
            ),
            orderBy: [sql`${territories.lastWorkedAt} ASC NULLS FIRST`],
            limit: 5,
            columns: {
                id: true,
                name: true,
                number: true,
                lastWorkedAt: true
            }
        });

        return {
            counts: {
                total: Number(totalRes.count),
                active: Number(activeRes.count),
                overdue: Number(overdueRes.count),
            },
            recentReturns,
            recentTaken,
            staleTerritories
        };
    })
});