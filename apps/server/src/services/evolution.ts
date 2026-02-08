import axios from 'axios';
import { env } from '../env';

interface SendMessageProps {
    instanceName: string;
    apiKey: string;
    remoteJid: string;
    text: string;
    imageUrl?: string;
}

const BASE_URL = env.EVOLUTION_API_URL.replace(/\/$/, '');

export async function sendTextMessage({ instanceName, apiKey, remoteJid, text }: SendMessageProps) {
    try {
        await axios.post(
            `${BASE_URL}/message/sendText/${instanceName}`,
            {
                number: remoteJid,
                text: text,
            },
            { headers: { apikey: apiKey } }
        );
    } catch (error) {
        console.error(`Erro ao enviar mensagem via Evolution:`, error);
    }
}

export async function sendImageMessage({ instanceName, apiKey, remoteJid, text, imageUrl }: SendMessageProps) {
    try {
        await axios.post(
            `${BASE_URL}/message/sendMedia/${instanceName}`,
            {
                number: remoteJid,
                mediatype: "image",
                mimetype: "image/png",
                caption: text,
                media: imageUrl, 
            },
            { headers: { apikey: apiKey } }
        );
    } catch (error) {
      console.error(`Erro ao enviar imagem para ${remoteJid}:`, error);
    }
}