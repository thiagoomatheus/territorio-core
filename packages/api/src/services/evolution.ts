import axios from "axios";
import { env } from "../env";

interface CreateGroupProps {
  instanceName: string;
  apiKey: string;
  groupName: string;
  participants: string[];
}

export const BASE_URL = env.EVOLUTION_API_URL.replace(/\/$/, '');

export async function createGroup({ instanceName, apiKey, groupName, participants }: CreateGroupProps) {
    try {
        const response = await axios.post(
            `${BASE_URL}/group/create/${instanceName}`,
            {
                subject: groupName,
                participants: participants,
            },
            {
                headers: { apikey: apiKey },
            }
        );
        
        return response.data;
    } catch (error: any) {
        console.error('Erro ao criar grupo:', error.response?.data || error.message);
        throw new Error('Falha ao criar grupo no WhatsApp.');
    }
}

export async function fetchContacts({ instanceName, apiKey }: { instanceName: string; apiKey: string }) {
    try {
        const response = await axios.post(
            `${BASE_URL}/chat/findContacts/${instanceName}`,
            {},
            { headers: { apikey: apiKey } }
        );
        return response.data;
    } catch (error) {
        return [];
    }
}

export async function fetchGroupInviteLink({ instanceName, apiKey, groupId }: { instanceName: string, apiKey: string, groupId: string }) {
    try {
        const response = await axios.get(
        `${BASE_URL}/group/inviteCode/${instanceName}/${groupId}`,
        {
            headers: { apikey: apiKey },
        }
        );
        return `https://chat.whatsapp.com/${response.data.response?.code || response.data.code}`;
    } catch (error) {
        console.error('Erro ao buscar link de convite:', error);
        return null;
    }
}