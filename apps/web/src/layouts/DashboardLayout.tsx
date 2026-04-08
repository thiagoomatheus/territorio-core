import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"
import { ModeToggle } from "@/components/mode-toogle"
import { useMe } from "@/hooks/auth/useMe"
import { Loader2 } from "lucide-react"

export function DashboardLayout() {

    const { user, isLoading } = useMe();

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const location = useLocation()
    
    const getPageTitle = () => {
        switch (location.pathname) {
            case "/territories": return "Territórios"
            case "/managers": return "Dirigentes"
            case "/settings": return "Configurações"
            default: return "Dashboard"
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                
                {/* Header Fixo no Topo */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1 " />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Território Bot
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="flex-1">
                            {/* Espaço vazio para empurrar o toggle para a direita */}
                        </div>
                        <ModeToggle />
                    </div>
                </header>

                {/* Conteúdo da Página */}
                <div className="flex flex-1 flex-col gap-4 p-4 pt-6 md:p-8 min-h-[calc(100vh-4rem)]">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}