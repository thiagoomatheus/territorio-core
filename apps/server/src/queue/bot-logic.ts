import { db } from '@territorio/db';
import { congregations, managers, territories, assignments } from '@territorio/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { sendTextMessage, sendImageMessage } from '../services/evolution';
import { addBotJob } from './producer';
import { env } from '../env';
import { clearUserState, getUserState, setUserState } from '../services/state';

export async function handleIncomingMessage(payload: any, instanceName: string) {
    const data = payload.data;
    if (!data || !data.key || data.key.fromMe) return;

    const remoteJid = data.key.remoteJid;
    const participant = data.key.participant || remoteJid;
    const messageContent = data.message?.conversation || data.message?.extendedTextMessage?.text;

    if (!messageContent) return;
    
    const org = await db.query.congregations.findFirst({
        where: eq(congregations.whatsappInstanceName, instanceName),
    });

    if (!org || !org.whatsappApiKey) {
        console.log(`Organização não encontrada para a instância ${instanceName}`);
        return;
    }
    
    if (remoteJid !== org.whatsappGroupId) {
        return; 
    }
    
    const phone = participant.split('@')[0];

    const manager = await db.query.managers.findFirst({
        where: and(
            eq(managers.phone, phone),
            eq(managers.congregationId, org.id),
            eq(managers.active, true)
        )
    });

    if (!manager) {
        return;
    }

    const userState = await getUserState(phone);
    const text: string = messageContent.trim();

    if (userState.step === "IDLE") {
        
        if (text.toLowerCase() === env.COMANDO_SOLICITAR_TERRITORIO) {
            const activeAssignments = await db.query.assignments.findMany({
                where: and(
                    eq(assignments.managerId, manager.id),
                    eq(assignments.status, 'ativo')
                ),
                with: { territory: true }
            });
    
            const LIMIT = env.LIMIT_ACTIVE_ASSIGNMENTS;

            if (activeAssignments && activeAssignments.length >= LIMIT) {
                await sendTextMessage({
                    instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                    text: `⚠️ Irmão ${manager.name}, você já atingiu o limite de ${LIMIT} ${LIMIT > 1 ? 'territórios' : 'território'}.\n\n${LIMIT > 1 ? 'Territórios' : 'Território'} atuais:\n${activeAssignments.map(a => `- ${a.territory.name}`).join('\n')}\n\nPor favor, devolva um antes de solicitar outro.`
                });
                return;
            }
    
            if (activeAssignments && activeAssignments.length > LIMIT && LIMIT > 0) {
                await sendTextMessage({
                    instanceName, apiKey: org.whatsappApiKey,
                    remoteJid: participant,
                    text: `⚠️ Irmão ${manager.name}, você já tem ${activeAssignments.length} ${activeAssignments.length > 1 ? 'territórios designados' : 'território designado'}.
                    ${activeAssignments.map(a => `\n- ${a.territory.name}`).join('')}
                    \nCaso já o tenha concluído, por favor, envie *${env.COMANDO_DEVOLVER_TERRITORIO}* para atualizar status do território.
                    Limite máximo de territórios ativos por dirigente é ${LIMIT}.
                    `
                });
            }

            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `Olá ${manager.name}! Que tipo de território você prefere?\n\n1️⃣ Urbano\n2️⃣ Rural\n3️⃣ Comercial\n\nResponda com o número.`
            });

            await setUserState(phone, { step: 'SELECT_TYPE' });
            return;
        }

        if (text.toLowerCase() === env.COMANDO_DEVOLVER_TERRITORIO.toLowerCase()) {
            const activeAssignments = await db.query.assignments.findMany({
                where: and(
                    eq(assignments.managerId, manager.id),
                    eq(assignments.status, 'ativo')
                ),
                with: { territory: true }
            });

            if (activeAssignments.length === 0) {
                await sendTextMessage({
                    instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                    text: `⚠️ Você não possui territórios ativos para devolver.`
                });
                return;
            }
            
            if (activeAssignments.length === 1) {
                const assignment = activeAssignments[0];
                await sendTextMessage({
                    instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                    text: `Devolvendo *${assignment.territory.name}*.\n\nInforme o motivo:\n1️⃣ Concluído\n2️⃣ Não trabalhado`
                });
                await setUserState(phone, { step: "AWAITING_REASON", assignmentId: assignment.id });
                return;
            }
            
            let msg = `Você tem ${activeAssignments.length} territórios. Qual deseja devolver?\n`;
            const options = activeAssignments.map((a, idx) => {
                msg += `\n${idx + 1}️⃣ *${a.territory.name}*`;
                return { code: (idx + 1).toString(), id: a.id, name: a.territory.name };
            });

            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: msg
            });

            await setUserState(phone, { step: 'SELECT_RETURN', assignments: options });
            return;
        }
            
    }

    if (userState.step === 'SELECT_TYPE') {
        const typeMap: Record<string, "urbano" | "rural" | "comercial"> = { '1': 'urbano', '2': 'rural', '3': 'comercial' };
        const selectedType: "urbano" | "rural" | "comercial" = typeMap[text];

        if (!selectedType) {
            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `Opção inválida. Digite *1* (Urbano), *2* (Rural) ou *3* (Comercial).`
            });
            return;
        }
        
        const options = await db.query.territories.findMany({
            where: and(
                eq(territories.congregationId, org.id),
                eq(territories.status, 'disponivel'),
                eq(territories.type, selectedType)
            ),
            orderBy: [asc(territories.lastWorkedAt)],
            limit: 2
        });

        if (options.length === 0) {
            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `😕 Não encontrei territórios do tipo *${selectedType}* disponíveis.
                
                Por favor, inicie o processo novamente com o comando *${env.COMANDO_DEVOLVER_TERRITORIO}* e escolha outro tipo ou tente novamente mais tarde.`
            });
            await clearUserState(phone);
            return;
        }

        if (options.length === 1) {
            await processAssignment(options[0], org, instanceName, participant, manager);
            await clearUserState(phone);
            return;
        }
        
        let msg = `Encontrei estas opções:\n`;
        const mapOptions = options.map((t, idx) => {
            msg += `\n${idx + 1}️⃣ *${t.number}* ${t.name ? `(${t.name})` : ''}`;
            return { code: (idx + 1).toString(), id: t.id };
        });
        msg += `\n\nQual você prefere? Digite 1 ou 2.`;

        await sendTextMessage({
            instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
            text: msg
        });

        await setUserState(phone, { step: 'SELECT_MAP', mapOptions });
        return;
    }

    if (userState.step === 'SELECT_MAP') {

        const choice = userState.mapOptions.find((opt: any) => opt.code === text);

        if (!choice) {
            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `Opção inválida. Escolha uma das opções acima.`
            });
            return;
        }
        
        const selectedTerritory = await db.query.territories.findFirst({
            where: eq(territories.id, choice.id)
        });

        if (selectedTerritory) {
            await processAssignment(selectedTerritory, org, instanceName, participant, manager);
        } else {
            await sendTextMessage({ instanceName, apiKey: org.whatsappApiKey, remoteJid: participant, text: "Erro ao buscar território." });
        }
        
        await clearUserState(phone);
        return;
    }

    if (userState.step === 'SELECT_RETURN') {
        const choice = userState.assignments.find((opt: any) => opt.code === text);

        if (!choice) {
             await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `Opção inválida. Tente novamente.`
            });
            return;
        }

        const assignment = await db.query.assignments.findFirst({
            where: eq(assignments.id, choice.id),
            with: { territory: true }
        });

        if (assignment) {
            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `Agora, informe o motivo da devolução:\n\n1️⃣ Concluído\n2️⃣ Não trabalhado`
            });
            await setUserState(phone, { step: "AWAITING_REASON", assignmentId: assignment.id });
            return;
        }

        await clearUserState(phone);
        return;
    }

    if (userState.step === 'AWAITING_REASON') {
        const reasonMap: Record<string, "concluido" | "nao_trabalhado"> = { '1': 'concluido', '2': 'nao_trabalhado' };
        const reason = reasonMap[text];

        if (!reason) {
            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `Opção inválida. Digite *1* (Concluído) ou *2* (Não trabalhado).`
            });
            return;
        }

        const assignment = await db.query.assignments.findFirst({
            where: eq(assignments.id, userState.assignmentId),
            with: { territory: true }
        });

        if (!assignment) {
            await sendTextMessage({
                instanceName, apiKey: org.whatsappApiKey, remoteJid: participant,
                text: `Erro ao encontrar o território para devolução. Tente novamente.`
            });
            await clearUserState(phone);
            return;
        }
        
        await processReturn(assignment, org, instanceName, participant, manager, reason === 'concluido');

        await clearUserState(phone);
        return;
    }
}

async function processAssignment(territory: any, org: any, instanceName: string, remoteJid: string, manager: any) {

    if (territory.status !== 'disponivel') {
        await sendTextMessage({
            instanceName, apiKey: org.whatsappApiKey, remoteJid,
            text: `⚠️ O território ${territory.name} acabou de ser pego por outro irmão. Tente novamente.`
        });
        return;
    }

    const newAssignment = await db.transaction(async (tx) => {
        const [assign] = await tx.insert(assignments).values({
            congregationId: org.id,
            territoryId: territory.id,
            managerId: manager.id,
            status: 'ativo',
            startedAt: new Date()
        }).returning();
        
        await tx.update(territories)
            .set({ status: 'trabalhando' })
            .where(eq(territories.id, territory.id));
        
        return assign;
    });

    const msg = `🗺️ *Novo Território Designado*\n\n📍 *${territory.name}*\n👤 Dirigente: ${manager.name}\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\nBom trabalho! Digite *${env.COMANDO_DEVOLVER_TERRITORIO}* aqui quando terminar.`;

    if (territory.imageUrl) {
        await sendImageMessage({
            instanceName, apiKey: org.whatsappApiKey, remoteJid,
            text: msg, imageUrl: territory.imageUrl
        });
    } else {
        await sendTextMessage({
            instanceName, apiKey: org.whatsappApiKey, remoteJid,
            text: msg
        });
    }
    
    const DAYS = env.DAYS_FOR_REMINDER_CHECK || 30;
    await addBotJob('reminder-job', {
        type: 'reminder_check',
        assignmentId: newAssignment.id,
        congregationId: org.id
    }, DAYS * 24 * 60 * 60 * 1000);
}

async function processReturn(assignment: any, org: any, instanceName: string, remoteJid: string, manager: any, concluded: boolean = true) {
    await db.transaction(async (tx) => {
        await tx.update(assignments)
            .set({ 
                status: concluded ? 'concluido' : 'cancelado', 
                finishedAt: new Date() 
            })
            .where(eq(assignments.id, assignment.id));
        const territoryUpdate: any = { status: "disponivel" };
        
        if (concluded) {
            territoryUpdate.lastWorkedAt = new Date();
        }

        await tx.update(territories)
            .set(territoryUpdate)
            .where(eq(territories.id, assignment.territoryId));
    });

    await sendTextMessage({
        instanceName, apiKey: org.whatsappApiKey,
        remoteJid,
        text: `✅ Irmão ${manager.name}, território *${assignment.territory.name}* devolvido como *${concluded ? 'Concluído' : 'Não trabalhado'}* com sucesso!`
    });
}