import { verify } from 'jsonwebtoken';
import { type CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { db } from '@territorio/db';
import { env } from './env';

interface JwtPayload {
  userId: string;
  organizationId: string | null;
  role: 'owner' | 'admin' | null;
}

export const createContext = ({ req }: CreateFastifyContextOptions) => {
    const authHeader = req.headers.authorization;
    
    const getUser = () => {
        if (!authHeader) return null;

        try {
            const token = authHeader.split(' ')[1];
            if (!token) return null;

            const decoded = verify(token, env.JWT_SECRET) as JwtPayload;
            return {
                id: decoded.userId,
                organizationId: decoded.organizationId,
                role: decoded.role
            };
        } catch (err) {
            return null;
        }
    };

    const user = getUser();
    
    return {
        db,
        user,
    };
};

export type Context = Awaited<ReturnType<typeof createContext>>;