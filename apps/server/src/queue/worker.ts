import { Worker } from 'bullmq';
import { connection } from '../lib/redis';
import { handleIncomingMessage } from './bot-logic';
import { db } from '@territorio/db';
import { assignments, congregations } from '@territorio/db/schema';
import { eq } from 'drizzle-orm';
import { sendTextMessage } from '@territorio/api/src/services/evolution';

console.log('🤖 Worker do Bot iniciado e aguardando mensagens...');

const worker = new Worker('bot-queue', async (job) => {
  const data = job.data;

  try {
    
    if (data.type === 'incoming_message') {
        console.log(`📩 Processando mensagem da instância: ${data.instanceName}`);
        await handleIncomingMessage(data.payload, data.instanceName);
    }
    
    if (data.type === 'reminder_check') {
        console.log(`⏰ Verificando lembrete para assignment: ${data.assignmentId}`);
        const assignment = await db.query.assignments.findFirst({
            where: eq(assignments.id, data.assignmentId),
            with: { manager: true, territory: true }
        });

        if (assignment && assignment.status === 'ativo') {
            const cong = await db.query.congregations.findFirst({
                where: eq(congregations.id, data.congregationId)
            });

            if (cong) {
                await sendTextMessage({
                    instanceName: cong.whatsappInstanceName!,
                    remoteJid: assignment.manager.phone + "@s.whatsapp.net",
                    text: `Olá irmão ${assignment.manager.name}! 👋\n\nVi que você ainda está com o território *${assignment.territory.name}*.\nJá conseguiu concluir? Se sim, digite *!devolver*.`
                });
            }
        }
    }

  } catch (error) {
        console.error(`❌ Erro no Job ${job.id} (Tentativa ${job.attemptsMade + 1}):`, error);
        throw error;
  }
}, { 
    connection,
    concurrency: 5
});

worker.on('completed', job => console.log(`✅ Job ${job.id} finalizado.`));
worker.on('failed', (job, err) => console.error(`🚨 Job ${job?.id} falhou: ${err.message}`));

export default worker;