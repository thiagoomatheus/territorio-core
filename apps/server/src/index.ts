import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from '@territorio/api'; // Importa o router principal da API
import { createContext } from './context';
import { env } from './env';
import { TRPCError } from '@trpc/server';
import { addBotJob } from './queue/producer';
import { ensureBucketExists } from './services/storage';

const server = Fastify({
    logger: true,
    maxParamLength: 5000,
});

async function main() {
    await server.register(cors, {
        origin: true,
        credentials: true,
    });
    
    server.get('/', async () => {
        return { status: 'ok', service: 'territorio-bot-server' };
    });
    
    await server.register(fastifyTRPCPlugin, {
        prefix: '/trpc',
        trpcOptions: {
            router: appRouter,
            createContext,
            onError({ path, error }: { path?: string; error: TRPCError }) {
                console.error(`❌ tRPC Error on '${path ?? 'unknown'}': ${error.message}`);
            },
        },
    });
    
    server.post('/webhook/evolution', async (request, reply) => {
        const body = request.body as any;
        
        console.log('📩 Webhook recebido:', JSON.stringify(body, null, 2));

        const isMessage = body?.type === 'messages.upsert';
    
        if (isMessage) {
            await addBotJob('whatsapp-event', {
                type: 'incoming_message',
                payload: body,
                instanceName: body.instance || body.sender
            });
        }

        return { received: true };
    });

    await ensureBucketExists()
    
    try {
        await server.listen({ port: env.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server rodando em http://localhost:${env.PORT}`);
        console.log(`🔗 tRPC endpoint: http://localhost:${env.PORT}/trpc`);
        console.log(`🤖 Bot Worker iniciado e ouvindo a fila...`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

main();