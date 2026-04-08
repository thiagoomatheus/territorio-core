import { useTRPC } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useConnectStep() {
    const trpc = useTRPC();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "connected" | "waiting_scan" | "error">("idle");

    const connectMutation = useMutation(trpc.whatsapp.connect.mutationOptions({
        onSuccess: (data) => {
            if (data.status === 'connected') {
                setStatus('connected');
            } else if (data.qrcode) {
                setQrCode(data.qrcode);
                setStatus('waiting_scan');
            }
        },
        onError: () => {
            setStatus('error');
        }
    }));
    
    useEffect(() => {
        connectMutation.mutate();
    }, []);

    const handleRetry = () => {
        setStatus('idle');
        setQrCode(null);
        connectMutation.mutate();
    };

    return {
        qrCode,
        status,
        isLoading: connectMutation.isPending,
        handleRetry
    };
}