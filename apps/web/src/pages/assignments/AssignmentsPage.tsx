import { Undo2, Search, CalendarClock } from "lucide-react";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useAssignmentsPage } from "@/hooks/assignments/useAssignmentsPage";

export function AssignmentsPage() {

    const { search, setSearch, activeList, historyList, loadingActive, loadingHistory, revokeId, setRevokeId, revokeMutation } = useAssignmentsPage();

    return (
        <div className="space-y-6">
        
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Designações</h1>
                <p className="text-muted-foreground">Controle quem está com os territórios e veja o histórico.</p>
                </div>
            </div>

            <div className="bg-white p-1 rounded-md border w-full sm:w-80 flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <Input 
                    placeholder="Filtrar por irmão ou território..." 
                    className="border-none shadow-none focus-visible:ring-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-100">
                    <TabsTrigger value="active">Em Campo (Ativos)</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                {/* --- TAB: ATIVOS --- */}
                <TabsContent value="active" className="mt-4">
                    <div className="rounded-md border bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead>Território</TableHead>
                                    <TableHead>Dirigente</TableHead>
                                    <TableHead>Retirado em</TableHead>
                                    <TableHead>Status Tempo</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingActive ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell></TableRow>
                                ) : (activeList || []).length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nenhum território está na rua no momento.</TableCell></TableRow>
                                ) : (
                                    activeList.map((a) => {
                                        const days = getDaysDiff(a.startedAt);
                                        return (
                                            <TableRow key={a.id}>
                                                <TableCell className="font-medium">{a.territory.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                            {a.dirigente?.name.substring(0,1)}
                                                        </span>
                                                        {a.dirigente?.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatDate(a.startedAt)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={days > 30 ? "destructive" : "secondary"} className="font-normal">
                                                        <CalendarClock className="w-3 h-3 mr-1" />
                                                        {days} dias
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                        onClick={() => setRevokeId(a.id)}
                                                    >
                                                        <Undo2 className="w-4 h-4 mr-2" /> Revogar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* --- TAB: HISTÓRICO --- */}
                <TabsContent value="history" className="mt-4">
                    <div className="rounded-md border bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead>Território</TableHead>
                                    <TableHead>Dirigente</TableHead>
                                    <TableHead>Situação</TableHead>
                                    <TableHead>Concluído em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingHistory ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell></TableRow>
                                ) : historyList && historyList.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Sem histórico.</TableCell></TableRow>
                                ) : (
                                    historyList!.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell>{a.territory.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.dirigente?.name}</TableCell>
                                            <TableCell>
                                                <AssignmentStatusBadge status={a.status} />
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {a.finishedAt ? formatDate(a.finishedAt) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal de Confirmação */}
            <AlertDialog open={!!revokeId} onOpenChange={(isOpen) => !isOpen && setRevokeId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar devolução forçada?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso marcará o território como <b>Disponível</b> novamente e removerá do nome do irmão.
                            Use isso apenas se o irmão esqueceu de devolver pelo bot.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => revokeId && revokeMutation.mutate({ assignmentId: revokeId })}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {revokeMutation.isPending ? "Processando..." : "Sim, Devolver"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

// Helpers
function getDaysDiff(dateStr: string | Date | null) {
    if (!dateStr) return 0;
    const start = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 3600 * 24));
}

function formatDate(dateStr: string | Date | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function AssignmentStatusBadge({ status }: { status: string }) {
    if (status === 'concluido') return <Badge className="bg-green-600 hover:bg-green-700">Concluído</Badge>;
    if (status === 'cancelado') return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Cancelado</Badge>;
    return <Badge variant="secondary">Ativo</Badge>;
}