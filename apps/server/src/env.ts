import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    
    PORT: z.coerce.number().default(3333),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    
    JWT_SECRET: z.string().min(1, "JWT_SECRET é obrigatório"),
    
    DATABASE_URL: z.url(),
    
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    
    WEBHOOK_SECRET: z.string().optional(), 

    EVOLUTION_API_URL: z.url(),
    EVOLUTION_API_GLOBAL_KEY: z.string().optional(),

    DAYS_FOR_REMINDER_CHECK: z.coerce.number().default(15).optional(),

    LIMIT_ACTIVE_ASSIGNMENTS: z.coerce.number().default(2).optional(),

    COMANDO_SOLICITAR_TERRITORIO: z.string().default('!territorio').optional(),
    COMANDO_DEVOLVER_TERRITORIO: z.string().default('!devolver').optional(),
    
    STORAGE_ENDPOINT: z.string().default('localhost'),
    STORAGE_PORT: z.coerce.number().default(9000),
    STORAGE_ACCESS_KEY: z.string().min(1),
    STORAGE_SECRET_KEY: z.string().min(1),
    STORAGE_BUCKET_NAME: z.string().default('territories'),
    STORAGE_USE_SSL: z.string().transform((s) => s === 'true').default(false),
    
    STORAGE_PUBLIC_URL: z.url(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Variáveis de ambiente inválidas:', _env.error.format());
    process.exit(1);
}

export const env = _env.data;