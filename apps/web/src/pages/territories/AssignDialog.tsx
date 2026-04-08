import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import useAssignDialog from "@/hooks/territories/useAssignDialog";

interface AssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    territoryId: string | null;
    territoryName: string | null;
}

export function AssignDialog({ open, onOpenChange, territoryId, territoryName }: AssignDialogProps) {

    const {
        managers,
        loadingManagers,
        selectedManagerId,
        setSelectedManagerId,
        sendZap,
        setSendZap,
        handleAssign,
        isAssigning
    } = useAssignDialog({
        onOpenChange,
        territoryId
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-100">
                <DialogHeader>
                    <DialogTitle>Entregar Território</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Mapa selecionado</Label>
                        <div className="p-2 border rounded bg-muted/50 font-medium">
                            {territoryName}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Selecionar Dirigente</Label>
                        <Select onValueChange={setSelectedManagerId} value={selectedManagerId}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingManagers ? "Carregando..." : "Escolha o irmão..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {managers?.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="sendZap" 
                            checked={sendZap} 
                            onCheckedChange={(checked) => setSendZap(!!checked)} 
                        />
                        <label htmlFor="sendZap" className="text-sm font-medium leading-none cursor-pointer">
                            Enviar mapa automaticamente pelo WhatsApp
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAssign} disabled={!selectedManagerId || isAssigning}>
                        {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Entrega
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}