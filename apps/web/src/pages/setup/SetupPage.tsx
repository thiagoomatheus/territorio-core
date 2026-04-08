import { useSetup } from "@/hooks/setup/useSetup";
import { ConnectStep } from "./steps/ConnectStep";
import { GroupStep } from "./steps/GroupStep";
import { Loader2 } from "lucide-react";

export function SetupPage() {
    const { step, isLoading, refetch } = useSetup();

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Carregando configurações...</p>
            </div>
        );
    }

    // Passos do Wizard
    // Step 1: Conectar WhatsApp (QR Code)
    // Step 2: Configurar Grupo
    // Step 3: Concluído (O hook useSetup redireciona automaticamente)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            
            {/* Header / Progresso */}
            <div className="w-full max-w-2xl mb-8 text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">Configuração Inicial</h1>
                <p className="text-gray-500">
                    Vamos preparar o seu assistente de territórios em poucos passos.
                </p>
                
                {/* Stepper Visual */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-16 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
                </div>
                <div className="text-sm font-medium text-primary">
                    Passo {step+1} de 2
                </div>
            </div>

            {/* Conteúdo Dinâmico */}
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                {step === 0 && <ConnectStep />}
                
                {step === 1 && <GroupStep onFinish={() => refetch()} />}
            </div>

        </div>
    );
}