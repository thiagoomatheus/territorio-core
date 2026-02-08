import { connection } from '../lib/redis';

const EXPIRE_TIME = 60 * 5;

export type BotState = 
    | { step: 'IDLE' }
    | { step: 'SELECT_TYPE' }
    | { step: 'SELECT_MAP', mapOptions: { code: string, id: string }[] }
    | { step: 'SELECT_RETURN', assignments: { code: string, id: string, name: string }[] }
    | { step: 'AWAITING_REASON', assignmentId: string };

export async function setUserState(phone: string, state: BotState) {
    await connection.set(`bot:state:${phone}`, JSON.stringify(state), 'EX', EXPIRE_TIME);
}

export async function getUserState(phone: string): Promise<BotState> {
    const data = await connection.get(`bot:state:${phone}`);
    return data ? JSON.parse(data) : { step: 'IDLE' };
}

export async function clearUserState(phone: string) {
    await connection.del(`bot:state:${phone}`);
}