import axios from "axios";
import { env } from "../env";
import { TRPCError } from "@trpc/server";

interface CreateGroupProps {
    instanceName: string;
    groupName: string;
    participants: string[];
}

interface CreateInstanceResponseSuccess {
    instance: {
        instanceName: string;
        instanceId: string;
        webhook_wa_business: null;
        access_token_wa_business: string;
        status: "created" | "connected" | "disconnected" | "deleted";
    },
    hash: {
        apikey: string;
    },
    settings: {
        reject_call: boolean;
        msg_call: string;
        groups_ignore: boolean;
        always_online: boolean;
        read_messages: boolean;
        read_status: boolean;
        sync_full_history: boolean
    }
}

interface DeleteInstanceResponseSuccess {
    status: "SUCCESS";
    error: boolean;
    response: {
        message: string;
    }
}

interface GetStatusInstanceResponseSuccess {
    instance: {
        instanceName: string;
        state: "open" | "close" | "connecting";
    }
}

interface FetchContactsResponseSuccess {
    id: string;
    remoteJid: string;
    pushName: string;
    profilePicUrl: string;
    createdAt: string;
    updatedAt: string;
    instanceId: string;
    isGroup: boolean;
    isSaved: boolean;
    type: string;
}

interface FetchGroupInviteLinkResponseSuccess {
    inviteUrl: string
    inviteCode: string;
}

interface CreateGroupResponseSuccess {
    id: string;
    addressingMode: string;
    subject: string;
    subjectOwner: string;
    subjectOwnerPn: string;
    subjectTime: number;
    size: number;
    creation: number;
    owner: string;
    ownerPn: string;
    owner_country_code: string;
    desc: string;
    descId: string;
    descOwner: string;
    descOwnerPn: string;
    descTime: number;
    restrict: boolean;
    announce: boolean;
    isCommunity: boolean;
    isCommunityAnnounce: boolean;
    joinApprovalMode: boolean;
    memberAddMode: boolean;
    participants: {
        id: string;
        phoneNumber: string;
        admin: string | null;
    }[];
}

interface FetchGroupsResponseSuccess {
    id: string;
    subject: string;
    subjectOwner: string;
    subjectTime: number;
    pictureUrl: string | null;
    size: number;
    creation: number;
    owner: string;
    desc: string;
    descId: string;
    restrict: boolean;
    announce: boolean;
    isCommunity: boolean;
    isCommunityAnnounce: boolean
}

interface ConnectInstanceResponseSuccess {
    base64: string;
    code: string;
    count: number;
    pairingCode: string | null;
}

interface FetchGroupInfoResponse {
    id: string;
    subject: string;
    participants: {
        id: string;
        admin: string | null;
    }[];
}

interface SendMessageProps {
    instanceName: string;
    remoteJid: string;
    text: string;
    imageUrl?: string;
}

export const BASE_URL = env.EVOLUTION_API_URL.replace(/\/$/, '');

export const API_KEY = env.AUTHENTICATION_API_KEY || '';

export async function createGroup({ instanceName, groupName, participants }: CreateGroupProps): Promise<CreateGroupResponseSuccess> {
    try {
        const response = await axios.post(
            `${BASE_URL}/group/create/${instanceName}`,
            {
                subject: groupName,
                description: `Olá irmãos, este grupo foi criado para cuidarmos bem de nosso território. Um bot (robô) irá nos ajudar na organização e controle dos territórios. Qualquer dúvida pode enviar no grupo.`,
                participants: participants,
            },
            {
                headers: { apikey: API_KEY },
            }
        );
        
        return response.data;
    } catch (error: any) {
        console.error('Erro ao criar grupo:', error.response?.data || error.message);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao criar grupo no WhatsApp.' });
    }
}

export async function fetchContacts({ instanceName }: { instanceName: string }): Promise<FetchContactsResponseSuccess[]> {
    try {
        const response = await axios.post(
            `${BASE_URL}/chat/findContacts/${instanceName}`,
            {},
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao buscar contatos do WhatsApp.' });
    }
}

export async function fetchGroupInviteLink({ instanceName, groupId }: { instanceName: string, groupId: string }): Promise<string> {
    try {
        const response = await axios.get(
            `${BASE_URL}/group/inviteCode/${instanceName}?groupJid=${groupId}`,
            {
                headers: { apikey: API_KEY },
            }
        );

        const data: FetchGroupInviteLinkResponseSuccess = response.data;

        return data.inviteUrl;
    } catch (error) {
        console.error('Erro ao buscar link de convite:', error);
        return '';
    }
}

export async function createInstance({ instanceName }: { instanceName: string }): Promise<CreateInstanceResponseSuccess> {
    try {
        const response = await axios.post(
            `${BASE_URL}/instance/create`,
            {
                instanceName: instanceName, integration: "WHATSAPP-BAILEYS",
            },
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao criar instância:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao criar instância do WhatsApp.' });
    }
}

export async function connectInstance({ instanceName }: { instanceName: string }): Promise<ConnectInstanceResponseSuccess> {
    try {
        const response = await axios.get(
            `${BASE_URL}/instance/connect/${instanceName}`,
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao conectar instância:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao conectar instância do WhatsApp.' });
    }
}

export async function fetchGroups({ instanceName }: { instanceName: string }): Promise<FetchGroupsResponseSuccess[]> {
    try {
        const response = await axios.get(
            `${BASE_URL}/group/fetchAllGroups/${instanceName}?getParticipants=true`,
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar grupos:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao buscar grupos do WhatsApp.' });
    }
}

export async function deleteInstance({ instanceName }: { instanceName: string }): Promise<DeleteInstanceResponseSuccess> {
    try {
        const response = await axios.delete(
            `${BASE_URL}/instance/delete/${instanceName}`,
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao deletar instância:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao deletar instância do WhatsApp.' });
    }
}

export async function getStatusInstance({ instanceName }: { instanceName: string }): Promise<GetStatusInstanceResponseSuccess> {
    try {
        const response = await axios.get(
            `${BASE_URL}/instance/connectionState/${instanceName}`,
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao obter status da instância:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao obter status da instância do WhatsApp.' });
    }
}

export async function fetchGroupInfo({ instanceName, groupJid }: { instanceName: string; groupJid: string }): Promise<FetchGroupInfoResponse> {
    try {
        const response = await axios.get(
            `${BASE_URL}/group/findGroupInfos/${instanceName}?groupJid=${groupJid}`,
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar info do grupo:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha ao buscar dados do grupo.' });
    }
}

export async function sendTextMessage({ instanceName, remoteJid, text }: SendMessageProps) {
    try {
        await axios.post(
            `${BASE_URL}/message/sendText/${instanceName}`,
            {
                number: remoteJid,
                text: text,
            },
            { headers: { apikey: API_KEY } }
        );
    } catch (error) {
        console.error(`Erro ao enviar mensagem via Evolution:`, error);
    }
}

export async function sendImageMessage({ instanceName, remoteJid, text, imageUrl }: SendMessageProps) {
    try {
        if (!imageUrl) {
            throw new Error("URL da imagem é obrigatória para enviar uma mensagem de imagem.");
        }

        const mimetype = imageUrl.endsWith('.png') ? 'image/png' : imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') ? 'image/jpeg' : 'application/octet-stream';

        const internalMediaUrl = imageUrl.replace("localhost", "minio");

        const imageResponse = await axios.get(internalMediaUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(imageResponse.data).toString('base64');

        await axios.post(
            `${BASE_URL}/message/sendMedia/${instanceName}`,
            {
                number: remoteJid,
                mediatype: "image",
                mimetype: mimetype,
                caption: text,
                media: base64,
                fileName: `territorio_${Date.now()}.${mimetype.split('/')[1]}`
            },
            { headers: { apikey: API_KEY } }
        );
    } catch (error) {
        console.error(`Erro ao enviar imagem para ${remoteJid}:`, error);
        await sendTextMessage({ instanceName, remoteJid, text: `[Erro ao enviar imagem] ${text}` });
    }
}

export async function updateGroupParticipants({ 
    instanceName,
    groupJid,
    participants,
    action
}: { 
    instanceName: string,
    groupJid: string,
    participants: string[],
    action: "add" | "remove" | "promote" | "demote"
}) {
    try {
        const response = await axios.post(
            `${BASE_URL}/group/updateParticipant/${instanceName}`,
            {
                groupJid: groupJid,
                action: action,
                participants: participants,
            },
            { headers: { apikey: API_KEY } }
        );
        return response.data;
    } catch (error: any) {
        console.error(`Erro ao ${action} participante no grupo:`, error.response?.data || error.message);
        return null;
    }
}