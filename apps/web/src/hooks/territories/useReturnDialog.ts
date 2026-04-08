import { useTRPC } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useReturnDialog({
    onOpenChange,
    assignmentId,
}: {
    onOpenChange: (open: boolean) => void;
    assignmentId: string | null;
}) {

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const completeMutation = useMutation(trpc.assignment.complete.mutationOptions({
        onSuccess: () => {
            toast("Território recolhido!");
            queryClient.invalidateQueries(trpc.territory.list.queryFilter());
            onOpenChange(false);
        },
        onError: (err) => toast("Erro", { description: err.message })
    }));

    const handleReturn = (concluded: boolean) => {
        if (!assignmentId) return;
        completeMutation.mutate({ assignmentId, concluded });
    };

    return {
        handleReturn,
        isPending: completeMutation.isPending,
    };
}