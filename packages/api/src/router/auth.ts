import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { router, publicProcedure, authenticatedProcedure } from '../trpc';
import { users, congregations } from '@territorio/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { env } from '../env';
import { Resend } from 'resend';
import * as crypto from 'crypto';

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

const resend = env.RESEND_API_KEY
    ? new Resend(env.RESEND_API_KEY)
    : null;

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${env.VITE_API_URL}/reset-password?token=${token}`;
  
  if (!resend) {
    console.log("-----------------------------------------");
    console.log(`📧 E-MAIL DE RECUPERAÇÃO (SIMULADO)`);
    console.log(`Para: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log("-----------------------------------------");
    return;
  }
  
  await resend.emails.send({
    from: 'Suporte <suporte@seusaas.com>',
    to: email,
    subject: 'Recuperação de Senha - Território Bot',
    html: `<p>Você solicitou a recuperação de senha. Clique no link abaixo:</p>
      <a href="${resetLink}">Resetar Senha</a>`
  });
}

export const authRouter = router({
  register: publicProcedure
  .input(z.object({
    name: z.string().min(3),
    email: z.email(),
    password: z.string().min(8).max(30),
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
      { id: newUser.id, congregationId: newCongregation.id, role: 'owner' },
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
      { id: user.id, congregationId: user.congregationId, role: user.role },
      JWT_SECRET, { expiresIn: '7d' }
    );

    return { user, token };
  }),

  forgotPassword: publicProcedure
  .input(z.object({ email: z.email() }))
  .mutation(async ({ ctx, input }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (user) {
      const token = crypto.randomBytes(20).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hora

      await ctx.db.update(users)
        .set({ resetPasswordToken: token, resetPasswordExpires: expires })
        .where(eq(users.id, user.id));
        
      await sendResetPasswordEmail(user.email, token);
    }

    return { success: true, message: "Se o e-mail existir, as instruções foram enviadas." };
  }),

  resetPassword: publicProcedure
  .input(z.object({ token: z.string(), newPassword: z.string().min(6) }))
  .mutation(async ({ ctx, input }) => {
    const user = await ctx.db.query.users.findFirst({
      where: and(
        eq(users.resetPasswordToken, input.token),
        gt(users.resetPasswordExpires, new Date())
      )
    });

    if (!user) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token inválido ou expirado.' });

    const hashedPassword = await hash(input.newPassword, 10);

    await ctx.db.update(users)
      .set({ 
        password: hashedPassword, 
        resetPasswordToken: null, 
        resetPasswordExpires: null 
      })
      .where(eq(users.id, user.id));

    return { success: true };
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