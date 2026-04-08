import { useTRPC } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useAssignmentsPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    
    const [revokeId, setRevokeId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Queries separadas para otimizar
    const { data: activeList, isLoading: loadingActive } = useQuery(trpc.assignment.list.queryOptions({ filter: 'active' }));
    const { data: historyList, isLoading: loadingHistory } = useQuery(trpc.assignment.list.queryOptions({ filter: 'history', limit: 50 }));

    const revokeMutation = useMutation(trpc.assignment.revoke.mutationOptions({
        onSuccess: () => {
            toast.success("Território devolvido manualmente", { description: "O status voltou para Disponível." });
            queryClient.invalidateQueries(trpc.assignment.list.queryOptions({ filter: 'active' }));
            queryClient.invalidateQueries(trpc.assignment.list.queryOptions({ filter: 'history' }));
            setRevokeId(null);
        },
        onError: (err) => toast.error("Erro ao devolver território", { description: err.message })
    }));

    // Função auxiliar para filtrar no front (busca rápida)
    const filterList = (list: any[] | undefined) => {
        if (!list) return [];
        if (!search) return list;
        const lower = search.toLowerCase();
        return list.filter(item => 
            item.territory.name.toLowerCase().includes(lower) || 
            item.dirigente?.name.toLowerCase().includes(lower)
        );
    };

    return {
        search,
        setSearch,
        activeList: filterList(activeList),
        historyList: filterList(historyList),
        loadingActive,
        loadingHistory,
        revokeId,
        setRevokeId,
        revokeMutation
    };
}