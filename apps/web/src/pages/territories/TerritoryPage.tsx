import { Plus, Search, MoreHorizontal, Pencil, Trash2, HandMetal, CheckCircle2 } from "lucide-react";
import { TerritoryDialog } from "./TerritoryDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTerritoryPage } from "@/hooks/territories/useTerritoryPage";
import { AssignDialog } from "./AssignDialog";
import { ReturnDialog } from "./ReturnDialog";

export function TerritoriesPage() {

    const {
        search,
        setSearch,
        isDialogOpen,
        setIsDialogOpen,
        territoryToEdit,
        territories,
        isLoading,
        openCreate,
        openEdit,
        deleteId,
        setDeleteId,
        deleteMutation,
        handleDelete,
        assignData,
        setAssignData,
        returnData,
        setReturnData
    } = useTerritoryPage();

    return (
        <div className="space-y-6">
        
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Territórios</h1>
                    <p className="text-muted-foreground">Gerencie a lista mestre de territórios da congregação.</p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="w-4 h-4" /> Novo Território
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 p-1 rounded-md border w-full sm:w-80 lg:w-96">
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <Input 
                    placeholder="Buscar por nome ou número..." 
                    className="border-none shadow-none focus-visible:ring-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Tabela */}
            <div className="rounded-md border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-20">Nº</TableHead>
                            <TableHead>Nome / Descrição</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Última Atividade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Carregando territórios...
                            </TableCell>
                        </TableRow>
                        ) : territories?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                Nenhum território encontrado.
                            </TableCell>
                        </TableRow>
                        ) : (
                        territories?.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">#{t.number}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                    <span className="font-medium">{t.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize font-normal">
                                    {t.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={t.status} />
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {t.lastWorkedAt 
                                    ? new Date(t.lastWorkedAt).toLocaleDateString('pt-BR') 
                                    : 'Nunca trabalhado'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>

                                            {t.status === 'disponivel' ? (
                                                <DropdownMenuItem onClick={() => setAssignData({ id: t.id, name: t.name })}>
                                                    <HandMetal className="mr-2 h-4 w-4 text-green-600" />
                                                    <span>Entregar Território</span>
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem 
                                                    onClick={() => {
                                                        const activeAssign = t.assignments?.[0];
                                                        if (activeAssign) setReturnData({ assignmentId: activeAssign.id, name: t.name });
                                                    }}
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
                                                    <span>Recolher/Finalizar</span>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => openEdit(t)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                onClick={() => setDeleteId(t.id)} 
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal de Create/Edit */}
            <TerritoryDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen}
                territoryToEdit={territoryToEdit}
            />

            <AssignDialog
                open={!!assignData} 
                onOpenChange={(open) => !open && setAssignData(null)}
                territoryId={assignData?.id || null}
                territoryName={assignData?.name || null}
            />

            <ReturnDialog
                open={!!returnData} 
                onOpenChange={(open) => !open && setReturnData(null)}
                assignmentId={returnData?.assignmentId || null}
                territoryName={returnData?.name || null}
            />

            {/* Alerta de Confirmação de Exclusão */}
            <AlertDialog open={!!deleteId} onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o território e seu histórico.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteMutation.isPending}
                    >
                    {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir"}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

    // Componente Auxiliar para Status Colorido
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        disponivel: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
        trabalhando: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
        quarentena: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
    };
    
    const labels: Record<string, string> = {
        disponivel: "Disponível",
        trabalhando: "Em Campo",
        quarentena: "Quarentena"
    };

    return (
        <Badge variant="outline" className={`border ${styles[status] || ""}`}>
        {labels[status] || status}
        </Badge>
    );
}