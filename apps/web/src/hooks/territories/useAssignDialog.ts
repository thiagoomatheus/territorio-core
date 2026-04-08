import { useTRPC } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function useAssignDialog({
    onOpenChange,
    territoryId
}: {
    onOpenChange: (open: boolean) => void;
    territoryId: string | null;
}) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [selectedManagerId, setSelectedManagerId] = useState<string>("");
    const [sendZap, setSendZap] = useState(true);

    // Busca lista de dirigentes ativos
    const { data: managers, isLoading: loadingManagers } = useQuery(trpc.managers.list.queryOptions({ onlyActive: true }));

    const assignMutation = useMutation(trpc.assignment.assign.mutationOptions({
        onSuccess: () => {
            toast("Território entregue!");
            queryClient.invalidateQueries(trpc.territory.list.queryFilter());
            onOpenChange(false);
        },
        onError: (err) => toast("Erro", {description: err.message })
    }));

    const handleAssign = () => {
        if (!territoryId || !selectedManagerId) return;
        assignMutation.mutate({
            territoryId,
            managerId: selectedManagerId,
            sendWhatsApp: sendZap
        });
    };

    return {
        managers,
        loadingManagers,
        selectedManagerId,
        setSelectedManagerId,
        sendZap,
        setSendZap,
        handleAssign,
        isAssigning: assignMutation.isPending,
    };
}