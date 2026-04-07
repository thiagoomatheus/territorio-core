import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    EVOLUTION_API_URL: z.url(),
    AUTHENTICATION_API_KEY: z.string().optional(),
    STORAGE_ENDPOINT: z.string().default('minio'),
    STORAGE_PORT: z.coerce.number().default(9000),
    STORAGE_ACCESS_KEY: z.string(),
    STORAGE_SECRET_KEY: z.string(),
    STORAGE_BUCKET_NAME: z.string().default('territorios'),
    STORAGE_PUBLIC_URL: z.url(),
    STORAGE_USE_SSL: z.string().transform((val) => val === 'true'),
    RESEND_API_KEY: z.string().optional(),
    VITE_API_URL: z.url().default('http://localhost:3333'),
    COMANDO_SOLICITAR_TERRITORIO: z.string().default("!territorio"),
    COMANDO_DEVOLVER_TERRITORIO: z.string().default("!devolver")
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Variáveis de ambiente inválidas:', _env.error.format());
    process.exit(1);
}

export const env = _env.data;