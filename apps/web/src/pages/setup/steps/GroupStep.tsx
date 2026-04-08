import { Controller } from "react-hook-form";
import { Loader2, PlusCircle } from "lucide-react";

// Componentes UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGroupStep } from "@/hooks/setup/useGroupStep";

export function GroupStep({ onFinish }: { onFinish: () => void }) {

    const { activeTab, setActiveTab, loadingGroups, groups, loadingContacts, contacts, control, errors, isLoadingCongregation, isLoadingCreateGroup, onSelectExisting, handleSubmit } = useGroupStep({ onFinish });

    return (
        <Card className="w-full max-w-xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle>Configurar Grupo de Territórios</CardTitle>
                <CardDescription>
                    Onde o bot vai interagir com os publicadores?
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="existing">Selecionar Existente</TabsTrigger>
                        <TabsTrigger value="create">Criar Novo</TabsTrigger>
                    </TabsList>

                    {/* ABA 1: EXISTENTE */}
                    <TabsContent value="existing" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Selecione um grupo que você administra:</Label>
                            {loadingGroups ? (
                                <div className="flex items-center justify-center p-4 text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando grupos...
                                </div>
                            ) : (
                                <Select onValueChange={onSelectExisting} disabled={isLoadingCongregation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um grupo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups?.map((g: any) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm">
                            ℹ️ Nota: O bot precisa ser Administrador do grupo para funcionar corretamente.
                        </div>
                    </TabsContent>

                    {/* ABA 2: CRIAR NOVO */}
                    <TabsContent value="create">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Nome do Grupo */}
                            <div className="space-y-2">
                                <Label htmlFor="g-name">Nome do Grupo</Label>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} id="g-name" placeholder="Ex: Territórios Central" />
                                    )}
                                />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message as string}</span>}
                            </div>

                            {/* Seleção de Participantes */}
                            <div className="space-y-2">
                                <Label>Adicionar Participantes Iniciais</Label>
                                <div className="border rounded-md h-48 overflow-y-auto p-2 space-y-1">
                                    {loadingContacts ? (
                                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                                    ) : (
                                        contacts?.map((contact: any) => (
                                            <Controller
                                                key={contact.id}
                                                control={control}
                                                name="participants"
                                                render={({ field }) => {
                                                    return (
                                                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                                            <Checkbox
                                                                id={contact.id}
                                                                checked={field.value?.includes(contact.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, contact.id])
                                                                        : field.onChange(field.value?.filter((value: string) => value !== contact.id))
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={contact.id}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                                                            >
                                                                {contact.name}
                                                            </label>
                                                        </div>
                                                    )
                                                }}
                                            />
                                        ))
                                    )}
                                </div>
                                {errors.participants && <span className="text-red-500 text-xs">{errors.participants.message as string}</span>}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoadingCreateGroup}>
                                {isLoadingCreateGroup ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando Grupo...</>
                                ) : (
                                    <><PlusCircle className="mr-2 h-4 w-4" /> Criar Grupo e Finalizar</>
                                )}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}