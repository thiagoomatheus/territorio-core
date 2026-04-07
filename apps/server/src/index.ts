import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from '@territorio/api';
import { createContext } from './context';
import { env } from './env';
import { TRPCError } from '@trpc/server';
import { addBotJob } from './queue/producer';
import './queue/worker';
import { ensureBucketExists } from '@territorio/api/src/services/storage';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '@territorio/db';
import { congregations, managers, users } from '@territorio/db/src/schema';
import path from 'node:path';
import { and, count, eq } from 'drizzle-orm';
import { compare, hash } from "bcryptjs";

const server = Fastify({
    logger: true,
    maxParamLength: 5000,
});

const cleanPhone = (jid: string) => jid.split('@')[0];

async function ensureAdminUser() {
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.warn("⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD não definidos no .env. Pulando criação do admin.");
        return;
    };

    const admin = await db.query.users.findFirst({
        where: eq(users.email, adminEmail),
    });

    if (!admin) {
        const [userCount] = await db.select({ value: count() }).from(users);

        if (userCount.value > 0) {
            console.warn("⚠️  Já existem usuários no banco, mas o admin definido no .env não foi encontrado. Verifique as credenciais ou crie o admin manualmente.");
            return;
        }

        if (userCount.value === 0) {
            console.log("🚀 Primeiro acesso detectado. Criando administrador via ENV...");

            await db.transaction(async (tx) => {
                
                const [cong] = await tx.insert(congregations).values({
                    name: "Minha Congregação",
                    number: 1,
                    setupStep: 0,
                }).returning();
                
                const passwordHash = await hash(adminPassword, 10);
                await tx.insert(users).values({
                    name: "Administrador Geral",
                    email: adminEmail,
                    password: passwordHash,
                    congregationId: cong.id,
                    role: 'owner',
                });
            });

            console.log(`✅ Admin criado com sucesso: ${adminEmail}`);
        }
    } else {
        const isSamePassword = await compare(adminPassword, admin.password);
        
        if (!isSamePassword) {
        console.log("🔐 Senha do ENV diferente do banco. Atualizando senha do admin...");
        const newHash = await hash(adminPassword, 10);
        
        await db.update(users)
        .set({ password: newHash })
        .where(eq(users.id, admin.id));

        console.log("✅ Senha do administrador sincronizada com o .env");
        }
    }
    
    
}

async function main() {

    console.log('⏳ Verificando atualizações no banco de dados...');
    try {
        await migrate(db, { 
            migrationsFolder: path.join(__dirname, '../../../packages/db/drizzle') 
        });
        console.log('✅ Banco de dados pronto!');
    } catch (err) {
        console.error('❌ Falha ao aplicar migrações:', err);
        process.exit(1); 
    }

    await ensureAdminUser();

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
        const eventType = body.event;
        const instanceName = body.instance;
        const eventData = body.data;
        
        console.log('📩 Webhook recebido:', eventType, instanceName);

        if (eventType === 'connection.update') {
            const state = body.data?.state;

            if (state === 'open') {
                console.log(`📡 Webhook: Instância ${instanceName} conectada!`);
                
                const cong = await db.query.congregations.findFirst({
                    where: and(
                        eq(congregations.whatsappInstanceName, instanceName),
                        eq(congregations.setupStep, 0)
                    )
                });

                if (cong) {
                    await db.update(congregations)
                        .set({ setupStep: 1 })
                        .where(eq(congregations.id, cong.id));
                    console.log(`✅ Status da congregação ${cong.number} atualizado para passo 1 via Webhook.`);
                }
            }
        }

        if (eventType === 'instance.delete') {
            console.log(`🗑️ Webhook: Instância ${instanceName} foi removida da Evolution.`);
            await db.update(congregations)
                .set({ 
                    whatsappInstanceName: null,
                    whatsappGroupId: null,
                    setupStep: 0
                })
                .where(eq(congregations.whatsappInstanceName, instanceName));
        }

        if (eventType === 'group-participants.update') {
            const groupId = eventData.id;
            const action = eventData.action;
            const participants = eventData.participants || [];
            
            const cong = await db.query.congregations.findFirst({
                where: eq(congregations.whatsappGroupId, groupId)
            });

            if (cong) {
                for (const participant of participants) {
                    
                    const phone = cleanPhone(participant.phoneNumber);

                    if (action === 'add') {
                        const existing = await db.query.managers.findFirst({
                            where: and(eq(managers.phone, phone), eq(managers.congregationId, cong.id))
                        });

                        if (!existing) {
                            await db.insert(managers).values({
                                congregationId: cong.id,
                                name: phone,
                                phone: phone,
                                active: true
                            });
                            console.log(`✅ Dirigente ${phone} cadastrado automaticamente.`);
                        } else if (!existing.active) {
                            await db.update(managers).set({ active: true }).where(eq(managers.id, existing.id));
                            console.log(`✅ Dirigente ${phone} reativado automaticamente.`);
                        }
                    }

                    if (action === 'remove') {
                        console.log(`🚫 Webhook: Participante ${phone} removido do grupo.`);
                        
                        await db.update(managers)
                            .set({ active: false })
                            .where(and(
                                eq(managers.phone, phone),
                                eq(managers.congregationId, cong.id)
                            ));
                        
                        console.log(`🔕 Dirigente ${phone} desativado no banco de dados.`);
                    }
                }
            }
        }
    
        if (eventType === 'messages.upsert') {
            console.log("📦 Adicionando mensagem à fila BullMQ...");
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