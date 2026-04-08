import { LogOut, Smartphone, AlertTriangle } from "lucide-react";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ConnectStep } from "../setup/steps/ConnectStep";
import { GroupStep } from "../setup/steps/GroupStep";
import { useSettingsPage } from "@/hooks/settings/useSettingsPage";

export function SettingsPage() {

    const { cong, updateCong, inviteEmail, setInviteEmail, inviteName, setInviteName, inviteAdmin, leaveCong } = useSettingsPage()

    if (!cong) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid gap-5 w-full grid-cols-3 max-w-100 bg-background dark:bg-background">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="team">Equipe</TabsTrigger>
                </TabsList>

                {/* --- ABA GERAL: NOME E NÚMERO --- */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados da Congregação</CardTitle>
                            <CardDescription>Informações básicas identificadoras.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <label>Nome</label>
                                <Input 
                                    defaultValue={cong.name} 
                                    onChange={(e) => updateCong.mutate({ name: e.target.value })} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <label>Número</label>
                                <Input 
                                    defaultValue={cong.number} 
                                    type="number"
                                    disabled
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">As alterações são salvas automaticamente.</p>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* --- ABA WHATSAPP: RECONEXÃO --- */}
                <TabsContent value="whatsapp">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Conexão</CardTitle>
                                <CardDescription>Gerencie a conexão do bot com a Evolution API.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-6 w-6 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-800">Conectado</p>
                                            <p className="text-sm text-green-600">Instância: {cong.whatsappInstanceName}</p>
                                        </div>
                                    </div>
                                    
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">Reconectar / Ler QR Code</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <ConnectStep />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Grupo de Territórios</CardTitle>
                                <CardDescription>Grupo onde o bot atua: <b>{cong.whatsappGroupId}</b></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary">Alterar Grupo do Bot</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <GroupStep onFinish={() => window.location.reload()} />
                                    </DialogContent>
                                </Dialog>
                                <p className="mt-2 text-xs text-red-500">
                                    Cuidado: Alterar o grupo pode fazer o bot parar de responder no grupo antigo.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- ABA EQUIPE: ADMINS E PERIGO --- */}
                <TabsContent value="team">
                    <div className="grid gap-6">
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Adicionar Administrador</CardTitle>
                                <CardDescription>Convide outro irmão para ajudar a gerenciar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        placeholder="Nome" 
                                        value={inviteName} 
                                        onChange={(e) => setInviteName(e.target.value)} 
                                    />
                                    <Input 
                                        placeholder="E-mail" 
                                        value={inviteEmail} 
                                        onChange={(e) => setInviteEmail(e.target.value)} 
                                    />
                                </div>
                                <Button 
                                    onClick={() => inviteAdmin.mutate({ 
                                        name: inviteName, 
                                        email: inviteEmail, 
                                        initialPassword: "mudar123" // Em prod, mande link por email
                                    })}
                                    disabled={inviteAdmin.isPending}
                                >
                                {inviteAdmin.isPending ? "Adicionando..." : "Adicionar à Equipe"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Zona de Perigo */}
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" /> Zona de Perigo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-red-900">Passar Responsabilidade / Sair</p>
                                        <p className="text-sm text-red-700">
                                            Remove seu acesso a esta congregação. <br/>
                                            Certifique-se de ter adicionado outro admin antes.
                                        </p>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => {
                                            if(confirm("Tem certeza que deseja sair da congregação?")) {
                                                leaveCong.mutate();
                                            }
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" /> Sair da Congregação
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}