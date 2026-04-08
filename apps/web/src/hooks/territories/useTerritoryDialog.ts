import { useEffect, useRef, useState } from "react";
import { useUpload } from "./useUpload";
import { useTRPC } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import type { TerritoryDialogProps } from "@/pages/territories/TerritoryDialog";
import { toast } from "sonner";
import { BlockSchema, typeEnumValues } from "@/pages/territories/schema";

export const territoryFormSchema = z.object({
    name: z.string().min(3, "Nome do território deve conter pelo menos 3 caracteres"),
    number: z.coerce.number().min(1, "Número do território deve ser maior que 0"),
    blocks: z.array(BlockSchema).optional().default([]),
    type: z.enum(typeEnumValues),
    imageUrl: z.string().nullable(),
    obs: z.string().optional(),
});

export type TerritoryFormValues = z.infer<typeof territoryFormSchema>;

export function useTerritoryDialog( {open, onOpenChange, territoryToEdit}: TerritoryDialogProps) {

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    
    const { uploadFile, isUploading } = useUpload();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mutações
    const createMutation = useMutation(trpc.territory.create.mutationOptions());
    const updateMutation = useMutation(trpc.territory.update.mutationOptions());

    const form = useForm<TerritoryFormValues>({
        resolver: zodResolver(territoryFormSchema) as any,
        defaultValues: {
            number: 0,
            name: "",
            obs: "",
            type: "urbano",
            imageUrl: "",
        },
    });
    
    useEffect(() => {
        if (open) {
            if (territoryToEdit) {
                form.reset({
                    number: territoryToEdit.number,
                    name: territoryToEdit.name,
                    obs: territoryToEdit.description || "",
                    type: territoryToEdit.type,
                    imageUrl: territoryToEdit.imageUrl || "",
                    blocks: territoryToEdit.blocks || [],
                });
                setPreviewUrl(territoryToEdit.imageUrl || null);
            } else {
                form.reset({
                    number: 0, 
                    name: "",
                    obs: "",
                    type: "urbano",
                    imageUrl: "",
                });
                setPreviewUrl(null);
            }
            setSelectedFile(null);
        }
    }, [open, territoryToEdit, form]);

    // Handler: Selecionar Arquivo
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    // Handler: Remover Imagem
    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        form.setValue("imageUrl", "");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Submit
    const onSubmit = async (values: TerritoryFormValues) => {
        try {
            let finalImageUrl = values.imageUrl;
            
            if (selectedFile) {
                const uploadedUrl = await uploadFile(selectedFile);
                if (!uploadedUrl) return;
                finalImageUrl = uploadedUrl;
            }
            
            if (territoryToEdit) {
                await updateMutation.mutateAsync({
                    ...values,
                    imageUrl: finalImageUrl,
                    type: values.type,
                    id: territoryToEdit.id,
                });
                toast.success("Território atualizado com sucesso!");
            } else {
                await createMutation.mutateAsync({
                    ...values,
                    imageUrl: finalImageUrl,
                    type: values.type || "urbano",
                    lastWorkedAt: new Date(),
                });
                toast.success("Território criado com sucesso!");
            }
            
            await queryClient.invalidateQueries(trpc.territory.list.queryFilter());
            onOpenChange(false);

        } catch (error: any) {
            toast.error("Erro ao salvar",{
                description: error.message 
            });
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending || isUploading;

    return {
        form,
        previewUrl,
        fileInputRef,
        handleFileSelect,
        handleRemoveImage,
        onSubmit,
        isSaving,
        isUploading,
    };
}