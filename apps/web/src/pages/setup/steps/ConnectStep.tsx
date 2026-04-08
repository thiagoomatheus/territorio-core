import { Loader2, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConnectStep } from "@/hooks/setup/useConnectStep";

export function ConnectStep() {
    
    const { qrCode, status, isLoading, handleRetry } = useConnectStep();

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>Conectar WhatsApp</CardTitle>
                <CardDescription>
                    O bot precisa de um número de WhatsApp para funcionar.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                
                {/* ESTADO: CARREGANDO */}
                {(isLoading || status === 'idle') && (
                    <div className="flex flex-col items-center justify-center h-64 w-full bg-muted/20 rounded-lg border-2 border-dashed">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground">Iniciando sessão...</p>
                    </div>
                )}

                {/* ESTADO: QR CODE GERADO */}
                {status === 'waiting_scan' && qrCode && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="relative p-2 bg-white rounded-lg border shadow-sm">
                            <img 
                                src={qrCode} 
                                alt="QR Code WhatsApp" 
                                className="w-64 h-64 object-contain" 
                            />
                        </div>
                        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
                            <p className="flex items-center justify-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                Abra o WhatsApp no seu celular
                            </p>
                            <p>Menu &gt; Aparelhos conectados &gt; Conectar</p>
                        </div>
                    </div>
                )}

                {/* ESTADO: ERRO */}
                {status === 'error' && (
                    <Alert variant="destructive">
                        <AlertTitle>Falha na conexão</AlertTitle>
                        <AlertDescription>
                            Não foi possível gerar o QR Code. Verifique se o servidor está rodando.
                        </AlertDescription>
                        <Button variant="outline" onClick={handleRetry} className="mt-4 col-start-2" >
                            <RefreshCw className="h-4 w-4" />
                            Tentar Novamente
                        </Button>
                    </Alert>
                )}

                {/* ESTADO: CONECTADO (Feedback visual rápido antes de mudar de tela) */}
                {status === 'connected' && (
                    <div className="flex flex-col items-center justify-center h-64 w-full bg-green-50 rounded-lg border border-green-200">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-green-700 font-medium">WhatsApp Conectado!</p>
                        <p className="text-green-600 text-sm">Redirecionando...</p>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}