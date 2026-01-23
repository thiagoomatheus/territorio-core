import { initTRPC, TRPCError } from '@trpc/server';
import { db } from '@territorio/db';
import superjson from 'superjson';
import { ZodError } from 'zod';

export type Context = {
    db: typeof db;
    user?: {
        id: string
        congregationId: string
    };
}

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                    ? error.cause.flatten()
                    : null,
            },
        }
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.user || !ctx.user.congregationId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
});

export const protectedProcedure = t.procedure.use(isAuthed);