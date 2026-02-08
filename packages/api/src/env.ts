import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    EVOLUTION_API_URL: z.url(),
    EVOLUTION_API_GLOBAL_KEY: z.string().optional()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Variáveis de ambiente inválidas:', _env.error.format());
    process.exit(1);
}

export const env = _env.data;