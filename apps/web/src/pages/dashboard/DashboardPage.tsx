import { useTRPC } from "@/utils/trpc";
import {
    Map as MapIcon,
    Clock,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownLeft,
    CalendarClock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/hooks/auth/useMe";

export function DashboardPage() {
    
    const trpc = useTRPC();

    const { user } = useMe();
    
    const { data: stats, isLoading, isError } = useQuery(trpc.dashboard.getStats.queryOptions(undefined, {
        enabled: !!user?.congregationId,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60,
    }));
    
    if (isError) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                Ocorreu um erro ao carregar as estatísticas. Tente recarregar a página.
            </div>
        );
    }
    
    if (isLoading || !user) {
        return <DashboardSkeleton />;
    }

    if (!stats) {
        return (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                Nenhuma estatística disponível. Comece cadastrando territórios e saídas!
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* --- CARDS DE NÚMEROS --- */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Territórios</CardTitle>
                        <MapIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.counts.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Em Campo</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{stats.counts.active}</div>
                        <p className="text-xs text-muted-foreground mt-1">Sendo trabalhados agora</p>
                    </CardContent>
                </Card>

                <Card className={stats.counts.overdue > 0 ? "border-red-200 bg-red-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Em Atraso</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${stats.counts.overdue > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.counts.overdue > 0 ? "text-red-700" : ""}`}>
                            {stats.counts.overdue}
                        </div>
                        <p className={`text-xs mt-1 ${stats.counts.overdue > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {stats.counts.overdue > 0 ? "Há mais de 30 dias na rua!" : "Tudo em dia"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                
                {/* --- ÚLTIMAS SAÍDAS --- */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5 text-blue-500" /> Saídas Recentes
                        </CardTitle>
                        <CardDescription>Quem pegou território recentemente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentTaken.length === 0 ? (
                                <EmptyState message="Nenhuma saída recente." />
                            ) : (
                                stats.recentTaken.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.territory.name}</span>
                                            <span className="text-muted-foreground text-xs">{item.manager?.name}</span>
                                        </div>
                                        <span className="text-muted-foreground whitespace-nowrap text-xs">
                                            {formatDate(item.startedAt)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* --- ÚLTIMAS DEVOLUÇÕES --- */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowDownLeft className="h-5 w-5 text-green-500" /> Devoluções Recentes
                        </CardTitle>
                        <CardDescription>Últimos territórios concluídos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentReturns.length === 0 ? (
                                <EmptyState message="Nenhuma devolução recente." />
                            ) : (
                                stats.recentReturns.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.territory.name}</span>
                                        <span className="text-muted-foreground text-xs">{item.manager?.name}</span>
                                    </div>
                                    <span className="text-muted-foreground whitespace-nowrap text-xs">
                                        {formatDate(item.finishedAt)}
                                    </span>
                                </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* --- SUGESTÕES (NÃO TRABALHADOS) --- */}
                <Card className="col-span-1 lg:col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-orange-500" /> Esquecidos
                        </CardTitle>
                        <CardDescription>Territórios disponíveis há mais tempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.staleTerritories.length === 0 ? (
                                <EmptyState message="Nenhum território disponível." />
                            ) : (
                                stats.staleTerritories.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-orange-400" />
                                                <span className="font-medium">#{item.number} {item.name}</span>
                                            </div>
                                            <span className="text-muted-foreground text-xs">
                                                {item.lastWorkedAt 
                                                    ? formatDate(item.lastWorkedAt) 
                                                    : 'Nunca trabalhado'}
                                            </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helpers
function formatDate(date: Date | string | null) {
    if (!date) return '-';
    return format(new Date(date), "dd/MM", { locale: ptBR });
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="h-24 flex items-center justify-center text-muted-foreground text-xs border border-dashed rounded-md bg-gray-50/50">
            {message}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
        </div>
    );
}