import * as Minio from 'minio';
import { env } from '../env';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = env.STORAGE_ENDPOINT || 'minio';
const port = Number(env.STORAGE_PORT) || 9000;
const accessKey = env.STORAGE_ACCESS_KEY || 'admin';
const secretKey = env.STORAGE_SECRET_KEY || 'password';
const bucketName = env.STORAGE_BUCKET_NAME || 'territorios';

export const minioClient = new Minio.Client({
    endPoint: endpoint, 
    port: port,
    useSSL: env.STORAGE_USE_SSL,
    accessKey,
    secretKey,
});

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.STORAGE_PUBLIC_URL,
    forcePathStyle: true,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    },
});

export async function ensureBucketExists() {
    const exists = await minioClient.bucketExists(env.STORAGE_BUCKET_NAME);
    if (!exists) {
        await minioClient.makeBucket(env.STORAGE_BUCKET_NAME, 'us-east-1');
        
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${env.STORAGE_BUCKET_NAME}/*`],
                },
            ],
            CORSRules: [
                {
                    AllowedOrigins: ["*"],
                    AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
                    AllowedHeaders: ["*"],
                    MaxAgeSeconds: 3000,
                },
            ],
        };
        await minioClient.setBucketPolicy(env.STORAGE_BUCKET_NAME, JSON.stringify(policy));
        console.log(`🪣 Bucket '${env.STORAGE_BUCKET_NAME}' criado e configurado.`);
    }
}

export async function getPresignedUploadUrl(filename: string, organizationId: string) {
    
    try {
        const cleanFileName = filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
        const objectName = `${organizationId}/${Date.now()}-${cleanFileName}`;
        
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            ContentType: "image/jpeg", // ou receba do frontend
        });

        const uploadUrl = await getSignedUrl(s3, command, {
            expiresIn: 300,
        });

        const finalUrl = `${process.env.STORAGE_PUBLIC_URL}/${bucketName}/${objectName}`;

        return { uploadUrl, finalUrl, objectName };
    } catch (error) {
        console.error("❌ ERRO NO STORAGE SERVICE:", error);
        throw error;
    }
}