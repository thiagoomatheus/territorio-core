import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useReturnDialog from "@/hooks/territories/useReturnDialog";

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string | null;
  territoryName: string | null;
}

export function ReturnDialog({ open, onOpenChange, assignmentId, territoryName }: ReturnDialogProps) {
    
    const { handleReturn, isPending } = useReturnDialog({ onOpenChange, assignmentId });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-100">
                <DialogHeader>
                    <DialogTitle>Recolher Território</DialogTitle>
                    <DialogDescription>
                        Como o território <b>{territoryName}</b> foi devolvido?
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 border-green-200 hover:bg-green-50 hover:text-green-700"
                        onClick={() => handleReturn(true)}
                        disabled={isPending}
                    >
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <span>Concluído</span>
                    </Button>

                    <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleReturn(false)}
                        disabled={isPending}
                    >
                        <XCircle className="h-8 w-8 text-red-600" />
                        <span>Não trabalhado</span>
                    </Button>
                </div>

                {isPending && (
                    <div className="flex justify-center">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}