import { Queue } from 'bullmq';
import { connection } from '../lib/redis';

export const botQueue = new Queue('bot-queue', { connection });

type JobData = 
    | { type: 'incoming_message'; payload: any; instanceName: string }
    | { type: 'reminder_check'; assignmentId: string; congregationId: string };

export async function addBotJob(name: string, data: JobData, delayMs?: number) {
    await botQueue.add(name, data, {
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: false,
    });
}