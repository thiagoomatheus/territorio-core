import { useTRPC } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const createGroupSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 letras"),
    participants: z.array(z.string()).min(1, "Selecione pelo menos 1 participante"),
});

export function useGroupStep( { onFinish }: { onFinish: () => void }) {
    const trpc = useTRPC();

    const [activeTab, setActiveTab] = useState("existing");

    // Queries
    const { data: groups, isLoading: loadingGroups } = useQuery(trpc.whatsapp.getGroups.queryOptions(undefined, {
        enabled: activeTab === "existing"
    }));
    
    const { data: contacts, isLoading: loadingContacts } = useQuery(trpc.whatsapp.getContacts.queryOptions(undefined, {
        enabled: activeTab === "create"
    }));

    // Mutations
    const selectGroupMutation = useMutation(trpc.whatsapp.selectGroup.mutationOptions({
        onSuccess: (data) => {
            toast.success("Configuração concluída!", {
                description: `${data.importedCount} dirigentes importados do grupo.`
            });
            onFinish();
        },
        onError: (err) => {
            toast.error("Erro ao importar", { description: err.message });
        }
    }));

    const createGroupMutation = useMutation(trpc.whatsapp.createGroup.mutationOptions({
        onSuccess: () => {
            toast.success("Grupo criado e dirigentes cadastrados!");
            onFinish();
        },
        onError: (err) => {
            toast.error("Erro ao criar grupo", { description: err.message });
        }
    }));

    // Form: Criar Grupo
    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(createGroupSchema),
        defaultValues: { name: "", participants: [] }
    });

    // Handlers
    const onSelectExisting = (groupId: string) => {
        selectGroupMutation.mutate({ groupId });
    };

    const onCreateSubmit = (data: any) => {
        createGroupMutation.mutate(data);
    };

    return {
        activeTab,
        setActiveTab,
        groups,
        loadingGroups,
        contacts,
        loadingContacts,
        control,
        onSelectExisting,
        handleSubmit: handleSubmit(onCreateSubmit),
        errors,
        isLoadingCongregation: selectGroupMutation.isPending,
        isLoadingCreateGroup: createGroupMutation.isPending
    };
}