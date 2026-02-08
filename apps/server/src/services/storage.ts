import * as Minio from 'minio';
import { env } from '../env';

export const minioClient = new Minio.Client({
    endPoint: env.STORAGE_ENDPOINT,
    port: env.STORAGE_PORT,
    useSSL: env.STORAGE_USE_SSL,
    accessKey: env.STORAGE_ACCESS_KEY,
    secretKey: env.STORAGE_SECRET_KEY,
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
        };
        await minioClient.setBucketPolicy(env.STORAGE_BUCKET_NAME, JSON.stringify(policy));
        console.log(`🪣 Bucket '${env.STORAGE_BUCKET_NAME}' criado e configurado.`);
    }
}

export async function getPresignedUploadUrl(filename: string, organizationId: string) {
    
    const objectName = `${organizationId}/${Date.now()}-${filename}`;
    
    const presignedUrl = await minioClient.presignedPutObject(
        env.STORAGE_BUCKET_NAME,
        objectName,
        5 * 60 
    );
    
    const finalPublicUrl = `${env.STORAGE_PUBLIC_URL}/${objectName}`;
    
    return {
        uploadUrl: presignedUrl,
        finalUrl: finalPublicUrl,
        objectName
    };
}