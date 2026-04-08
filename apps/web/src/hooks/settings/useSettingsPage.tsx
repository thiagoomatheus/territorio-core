import { useTRPC } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useSettingsPage() {
    const trpc = useTRPC();
    const navigate = useNavigate();
    
    const { data: cong } = useQuery(trpc.congregation.get.queryOptions());
    const { data: user } = useQuery(trpc.auth.me.queryOptions());
    
    const updateCong = useMutation(trpc.congregation.update.mutationOptions({
        onSuccess: () => toast.success("Configurações salvas!"),
        onError: (err) => toast.error("Erro ao salvar configurações", { description: err.message })
    }));

    const inviteAdmin = useMutation(trpc.team.inviteAdmin.mutationOptions({
        onSuccess: () => toast.success("Convite enviado!"),
        onError: (err) => toast.error("Erro ao enviar convite", { description: err.message })
    }));

    const leaveCong = useMutation(trpc.team.leaveCongregation.mutationOptions({
        onSuccess: () => {
            localStorage.removeItem("territorio-token");
            navigate("/login");
        },
        onError: (err) => toast.error("Erro ao sair da congregação", { description: err.message })
    }));
    
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");

    return {
        cong,
        user,
        updateCong,
        inviteEmail,
        setInviteEmail,
        inviteName,
        setInviteName,
        inviteAdmin,
        leaveCong
    };

}