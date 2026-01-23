import z from "zod";
import { publicProcedure, router } from "../trpc";
import { eq } from "drizzle-orm";
import { users } from "@territorio/db/schema";
import { TRPCError } from "@trpc/server";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

export const authRouter = router({
    register: publicProcedure
    .input(
        z.object({
            name: z.string().min(3),
            email: z.email(),
            password: z.string().min(6),
        })
    )
    .output(z.object({ 
        user: z.object({ 
            id: z.string(), 
            name: z.string(), 
            email: z.string() 
        }),
        token: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
        const { name, email, password } = input;

        const existingUser = await ctx.db.query.users.findFirst({
            where: eq(users.email, email),
        });
        
        if (existingUser) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Email já está em uso' });
        }

        const passwordHash = await hash(password, 10);

        return await ctx.db.transaction(async (tx) => {
            const [newUser] = await tx.insert(users).values({
                name,
                email,
                password: passwordHash,
            }).returning();

            const token = sign(
            { userId: newUser.id, organizationId: null },
            JWT_SECRET,
            { expiresIn: '7d' }
            );

            return {
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
            token,
            };
        });
    }),
    login: publicProcedure.
    input(
        z.object({
            email: z.email(),
            password: z.string().min(6),
        })
    )
    .output(z.object({ 
        user: z.object({ 
            id: z.string(), 
            name: z.string(), 
            email: z.string() 
        }),
        token: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
        const { email, password } = input;

        const user = await ctx.db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário não encontrado' });
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas' });
        }

        const token = sign(
            { userId: user.id, organizationId: user.congregationId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            user: { id: user.id, name: user.name, email: user.email },
            token,
        };
    }),
});