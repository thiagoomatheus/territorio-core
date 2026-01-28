import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { statusEnum, territories } from "@territorio/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const statusEnumValues = statusEnum.enumValues as [string, ...string[]];
const typeEnumValues = statusEnum.enumValues as [string, ...string[]];

type StatusEnum = "disponivel" | "trabalhando";
type TypeEnum = "rural" | "comercial" | "urbano";

const TerritorySchema = z.object({
  id: z.uuid(),
  congregationId: z.uuid(),
  name: z.string(),
  number: z.number(),
  blocks: z.union([z.array(z.array(z.string())), z.null()]).transform(val => 
    typeof val === 'string' ? JSON.parse(val) : val
  ),
  type: z.enum(typeEnumValues).nullable(),
  imageUrl: z.string().nullable(),
  obs: z.string().nullable(),
  status: z.enum(statusEnumValues),
  lastWorkedAt: z.date(),
  createdAt: z.date(),
});

const SuccessResponse = z.object({
  message: z.string(),
  id: z.uuid(),
});

export const territoryRouter = router({
    
    list: protectedProcedure
        .input(z.object({
            status: z.enum(statusEnumValues).optional(),
            orderBy: z.enum(['name', 'lastWorkedAt']).default('name'),
        }).optional())
        .output(z.array(TerritorySchema))
        .query(async ({ ctx, input }) => {
            const filters = [eq(territories.congregationId, ctx.user.congregationId)];
            
            if (input?.status) {
                filters.push(eq(territories.status, input.status as StatusEnum));
            }
            
            const order = input?.orderBy === 'lastWorkedAt' 
                ? desc(territories.lastWorkedAt)
                : asc(territories.name);

            const results = await ctx.db.query.territories.findMany({
                where: and(...filters),
                orderBy: [order],
            });
            
            return results.map(territory => ({
                ...territory,
                blocks: typeof territory.blocks === 'string' ? JSON.parse(territory.blocks) : territory.blocks,
            }));
    }),
    
    byId: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .output(TerritorySchema.nullable())
        .query(async ({ ctx, input }) => {
            const result = await ctx.db.query.territories.findFirst({
                where: and(
                    eq(territories.id, input.id),
                    eq(territories.congregationId, ctx.user.congregationId)
                ),
            });
            
            if (!result) return null;
            
            return {
                ...result,
                blocks: typeof result.blocks === 'string' ? JSON.parse(result.blocks) : result.blocks,
            };
    }),
    
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1, "Nome é obrigatório"),
            number: z.number(),
            blocks: z.array(z.array(z.string())).optional(),
            type: z.enum(typeEnumValues),
            imageUrl: z.url("URL inválida").optional().or(z.literal('')),
            obs: z.string().optional(),
            lastWorkedAt: z.date()
        }))
        .output(TerritorySchema)
        .mutation(async ({ ctx, input }) => {
            const [newTerritory] = await ctx.db.insert(territories).values({
                congregationId: ctx.user.congregationId,
                name: input.name,
                number: input.number,
                blocks: input.blocks ? JSON.stringify(input.blocks) : null,
                type: input.type as TypeEnum,
                lastWorkedAt: input.lastWorkedAt,
                obs: input.obs || null,
                imageUrl: input.imageUrl || null
            }).returning();

            return {
                ...newTerritory,
                blocks: typeof newTerritory.blocks === 'string' ? JSON.parse(newTerritory.blocks) : newTerritory.blocks,
            };
    }),
    
    update: protectedProcedure
        .input(z.object({
            id: z.uuid(),
            name: z.string().min(1).optional(),
            number: z.number().optional(),
            blocks: z.array(z.array(z.string())).optional(),
            type: z.enum(typeEnumValues).optional(),
            obs: z.string().optional(),
            imageUrl: z.string().optional(),
            status: z.enum(statusEnumValues).optional(),
            lastWorkedAt: z.date().optional(),
        }))
        .output(TerritorySchema)
        .mutation(async ({ ctx, input }) => {
            
        const [updated] = await ctx.db.update(territories)
            .set({
                name: input.name,
                number: input.number,
                blocks: input.blocks ? JSON.stringify(input.blocks) : undefined,
                type: input.type as TypeEnum | undefined,
                lastWorkedAt: input.lastWorkedAt,
                obs: input.obs,
                imageUrl: input.imageUrl,
                status: input.status as StatusEnum | undefined,
            })
            .where(and(
                eq(territories.id, input.id),
                eq(territories.congregationId, ctx.user.congregationId)
            ))
            .returning();

        if (!updated) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Território não encontrado ou sem permissão.' });
        }

        return {
            ...updated,
            blocks: typeof updated.blocks === 'string' ? JSON.parse(updated.blocks) : updated.blocks,
        };
    }),
    
    delete: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .output(SuccessResponse)
        .mutation(async ({ ctx, input }) => {
            const deleted = await ctx.db.delete(territories)
                .where(and(
                    eq(territories.id, input.id),
                    eq(territories.congregationId, ctx.user.congregationId)
                ))
                .returning({ id: territories.id });

            if (deleted.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Território não encontrado.' });
            }

            return { message: 'Território removido com sucesso.', id: deleted[0].id };
    }),
});