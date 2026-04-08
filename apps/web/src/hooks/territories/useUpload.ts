import { useState } from "react";
import { useTRPC } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUpload() {
    
    const [isUploading, setIsUploading] = useState(false);
    
    const trpc = useTRPC();
    const getUrlMutation = useMutation(trpc.storage.getUploadUrl.mutationOptions());

    const uploadFile = async (file: File): Promise<string | null> => {
        setIsUploading(true);
        try {
            
            const { uploadUrl, finalUrl } = await getUrlMutation.mutateAsync({
                filename: file.name,
                contentType: file.type
            });

            console.log(file.type);
            
            
            const response = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!response.ok) {
                throw new Error("Falha ao enviar arquivo para o storage");
            }

            return finalUrl;
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Erro no upload", {
                description: "Não foi possível enviar a imagem. Tente novamente."
            });
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading };
}