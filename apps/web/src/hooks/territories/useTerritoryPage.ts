import { useTRPC } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useTerritoryPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    
    // Estados Locais
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [territoryToEdit, setTerritoryToEdit] = useState<any>(null);
    const [assignData, setAssignData] = useState<{id: string, name: string} | null>(null);
    const [returnData, setReturnData] = useState<{assignmentId: string, name: string} | null>(null);
    
    // Estado para Deleção
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Queries
    const { data: allTerritories, isLoading } = useQuery(trpc.territory.list.queryOptions());

    const territories = allTerritories?.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        String(t.number).includes(search)
    );

    // Mutações
    const deleteMutation = useMutation(trpc.territory.delete.mutationOptions({
        onSuccess: async () => {
            toast.success("Território excluído com sucesso!");
            await queryClient.invalidateQueries(
                trpc.territory.list.queryFilter()
            );
            setDeleteId(null);
        },
        onError: (err) => {
            toast.error("Erro ao excluir território", {
                description: err.message || "Tente novamente mais tarde."
            });
        }
    }));

    // Handlers
    const openCreate = () => {
        setTerritoryToEdit(null);
        setIsDialogOpen(true);
    };

    const openEdit = (territory: any) => {
        setTerritoryToEdit(territory);
        setIsDialogOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) deleteMutation.mutate({ id: deleteId });
    };

    return {
        search,
        setSearch,
        isDialogOpen,
        setIsDialogOpen,
        territoryToEdit,
        setTerritoryToEdit,
        territories,
        isLoading,
        openCreate,
        openEdit,
        deleteId,
        setDeleteId,
        deleteMutation,
        handleDelete,
        assignData,
        setAssignData,
        returnData,
        setReturnData
    }
}