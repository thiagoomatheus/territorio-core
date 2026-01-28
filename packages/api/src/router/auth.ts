import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { router, publicProcedure, authenticatedProcedure } from '../trpc';
import { users, congregations } from '@territorio/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

const UserProfileSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    congregationId: z.uuid().nullable(),
    role: z.enum(['owner', 'admin']).nullable(),
});

const AuthResponseSchema = z.object({
    user: UserProfileSchema,
    token: z.string(),
});

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
        name: z.string().min(3),
        email: z.email(),
        password: z.string().min(6),
        congregationName: z.string().min(3),
        congregationNumber: z.number().int().positive(),
    }))
    .output(AuthResponseSchema)
    .mutation(async ({ ctx, input }) => {
       const existingUser = await ctx.db.query.users.findFirst({
            where: eq(users.email, input.email)
       });
       if (existingUser) throw new TRPCError({ code: 'CONFLICT', message: 'E-mail já em uso.' });

       const passwordHash = await hash(input.password, 10);

       return await ctx.db.transaction(async (tx) => {
            const existingCongregation = await tx.query.congregations.findFirst({
                where: eq(congregations.number, input.congregationNumber)
            });
            if (existingCongregation) throw new TRPCError({ code: 'CONFLICT', message: 'Número de congregação já existe.' });

            const [newCongregation] = await tx.insert(congregations).values({
                name: input.congregationName,
                number: input.congregationNumber,
                setupStep: 1, 
            }).returning();

            const [newUser] = await tx.insert(users).values({
                name: input.name,
                email: input.email,
                password: passwordHash,
                congregationId: newCongregation.id,
                role: 'owner',
            }).returning();

            const token = sign(
                { userId: newUser.id, organizationId: newCongregation.id, role: 'owner' },
                JWT_SECRET, { expiresIn: '7d' }
            );

            return { user: newUser, token };
       });
    }),

  login: publicProcedure
    .input(z.object({ email: z.email(), password: z.string() }))
    .output(AuthResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({ where: eq(users.email, input.email) });
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail inválido.' });

      const isValid = await compare(input.password, user.password);
      if (!isValid) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha inválida.' });

      const token = sign(
        { userId: user.id, organizationId: user.congregationId, role: user.role },
        JWT_SECRET, { expiresIn: '7d' }
      );

      return { user, token };
    }),
    
  me: authenticatedProcedure
    .output(UserProfileSchema.nullable())
    .query(async ({ ctx }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user!.id)
      });
      return user || null;
    })
});