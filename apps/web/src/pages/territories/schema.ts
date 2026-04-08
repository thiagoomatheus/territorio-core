import { statusEnum, typeEnum } from "@territorio/db/schema";
import z from "zod";

export const statusEnumValues = statusEnum.enumValues as [string, ...string[]];
export const typeEnumValues = typeEnum.enumValues as [string, ...string[]];

export type StatusEnum = "disponivel" | "trabalhando";
export type TypeEnum = "rural" | "comercial" | "urbano";

export const HouseSchema = z.object({
    id: z.string(),
    number: z.string(),
    visited: z.boolean().default(false),
});

export const StreetSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Nome da rua obrigatório"),
    houses: z.array(HouseSchema).default([]),
});

export const BlockSchema = z.object({
    id: z.string(),
    number: z.string().min(1, "Número/Nome da quadra obrigatório"),
    streets: z.array(StreetSchema).default([]),
});

export const TerritorySchema = z.object({
    id: z.uuid(),
    congregationId: z.uuid(),
    name: z.string().min(3, "Nome do território deve conter pelo menos 3 caracteres"),
    number: z.coerce.number().min(1, "Número do território deve ser maior que 0"),
    blocks: z.array(BlockSchema).optional().default([]),
    type: z.enum(typeEnumValues),
    imageUrl: z.string().nullable(),
    obs: z.string().optional(),
    status: z.enum(statusEnumValues),
    lastWorkedAt: z.date(),
    createdAt: z.date(),
});