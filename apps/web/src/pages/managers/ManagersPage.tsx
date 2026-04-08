import { Controller } from "react-hook-form";
import { Plus, Search, Pencil, Phone, Calendar, User } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"; // Seus componentes customizados
import { Skeleton } from "@/components/ui/skeleton";
import { useManagersPage } from "@/hooks/managers/useManagersPage";

export function ManagersPage() {

    const {
        search,
        setSearch,
        showInactive,
        setShowInactive,
        isDialogOpen,
        setIsDialogOpen,
        form,
        editingManager,
        handleOpenCreate,
        handleOpenEdit,
        handleCloseDialog,
        onSubmit,
        managers,
        isLoading,
        isSaving
    } = useManagersPage();
    
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dirigentes</h1>
                    <p className="text-muted-foreground">Gerencie os irmãos autorizados a solicitar territórios.</p>
                </div>
                <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Novo Dirigente
                </Button>
            </div>

            {/* Toolbar de Filtros */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nome ou telefone..." 
                        className="pl-9 border-none focus-visible:ring-1 focus-visible:ring-offset-0"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 pr-2">
                    <Switch
                        id="show-inactive" 
                        checked={showInactive} 
                        onCheckedChange={setShowInactive} 
                    />
                    <Label htmlFor="show-inactive" className="text-sm text-muted-foreground cursor-pointer">
                        Mostrar Inativos
                    </Label>
                </div>
            </div>

            {/* Tabela */}
            <div className="rounded-md border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead>Nome</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : managers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    Nenhum dirigente encontrado com os filtros atuais.
                                </TableCell>
                            </TableRow>
                        ) : (
                            managers?.map((manager) => (
                                <TableRow key={manager.id} className="group">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {manager.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {manager.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-3 h-3" />
                                            {formatPhone(manager.phone)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {manager.active ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">Ativo</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Inativo</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {manager.createdAt ? new Date(manager.createdAt).toLocaleDateString('pt-BR') : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity"
                                            onClick={() => handleOpenEdit(manager)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal de Create/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>{editingManager ? "Editar Dirigente" : "Novo Dirigente"}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo. O telefone deve ser o mesmo utilizado no WhatsApp.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FieldGroup className="space-y-4">
                            
                            {/* Nome */}
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="name">Nome Completo</FieldLabel>
                                        <div className="relative">
                                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                {...field} 
                                                id="name" 
                                                placeholder="Ex: João Silva" 
                                                className="pl-9"
                                                aria-invalid={fieldState.invalid}
                                            />
                                        </div>
                                        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                                    </Field>
                                )}
                            />

                            {/* Telefone */}
                            <Controller
                                name="phone"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="phone">WhatsApp (Apenas números)</FieldLabel>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                {...field} 
                                                id="phone" 
                                                placeholder="Ex: 5511999999999" 
                                                className="pl-9"
                                                aria-invalid={fieldState.invalid}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    field.onChange(val);
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Inclua o código do país (55) e o DDD.
                                        </p>
                                        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                                    </Field>
                                )}
                            />

                            {/* Ativo (Apenas na edição) */}
                            {editingManager && (
                                <Controller
                                    name="active"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Status Ativo</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Se desativado, o bot ignorará mensagens deste número.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    )}
                                />
                            )}

                        </FieldGroup>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Dirigente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function formatPhone(phone: string) {
    if (!phone) return "";
    
    return phone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4}).*/, '+$1 ($2) $3-$4');
}