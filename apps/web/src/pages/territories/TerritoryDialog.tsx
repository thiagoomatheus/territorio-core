import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTerritoryDialog } from "@/hooks/territories/useTerritoryDialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BlockList } from "./components/BlockList";
import { Separator } from "@/components/ui/separator";

export interface TerritoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    territoryToEdit?: any | null;
}

export function TerritoryDialog({ open, onOpenChange, territoryToEdit }: TerritoryDialogProps) {

    const { form, isSaving, handleFileSelect, handleRemoveImage, previewUrl, isUploading, fileInputRef, onSubmit } = useTerritoryDialog({ open, onOpenChange, territoryToEdit });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{territoryToEdit ? "Editar Território" : "Novo Território"}</DialogTitle>
                    <DialogDescription>
                        Preencha os dados do mapa. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>

                <form id="territory-form" onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("Erro de Validação:", errors))} className="space-y-6">

                    <FieldGroup className="grid grid-cols-4 gap-4">
                        {/* NÚMERO */}
                        <div className="col-span-1">
                            <Controller
                                name="number"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="territory-form-number">Número</FieldLabel>
                                        <Input
                                            {...field}
                                            id="territory-form-number"
                                            aria-invalid={fieldState.invalid}
                                            type="number"
                                            placeholder="Ex: 1"
                                            defaultValue={0}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        {/* NOME */}
                        <div className="col-span-3">
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="territory-form-name">Nome / Referência</FieldLabel>
                                        <Input
                                            {...field}
                                            id="territory-form-name"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Ex: Centro - Setor A"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        {/* TIPO */}
                        <div className="col-span-2">
                            <Controller
                                name="type"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="territory-form-type">Tipo</FieldLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                            <SelectTrigger className="bg-input! text-primary! hover:text-primary!" id="territory-form-type">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="urbano">Urbano (Residencial)</SelectItem>
                                                <SelectItem value="rural">Rural (Sítios/Fazendas)</SelectItem>
                                                <SelectItem value="comercial">Comercial (Lojas)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        {/* OBSERVAÇÕES */}
                        <div className="col-span-2">
                            <Controller
                                control={form.control}
                                name="obs"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col gap-2" data-invalid={fieldState.invalid}>
                                        <FieldLabel>Observações</FieldLabel>
                                        <Textarea 
                                            placeholder="Detalhes sobre ruas, quadras ou pontos de referência..." 
                                            className="resize-none h-20" 
                                            {...field} 
                                            aria-invalid={fieldState.invalid}
                                            value={field.value || ""}
                                        />
                                        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                                    </Field>
                                )}
                            />
                        </div>

                        <Separator className="col-span-4" />

                        {/* QUADRAS */}
                        <BlockList control={form.control} />

                        <Separator className="col-span-4" />

                        {/* UPLOAD IMAGEM */}
                        <Field className="flex flex-col gap-2 col-span-4">
                            <FieldLabel>Mapa (Imagem)</FieldLabel>

                            {!previewUrl ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">Clique para selecionar</p>
                                    <p className="text-xs text-gray-400">JPG, PNG (Max 5MB)</p>
                                </div>
                            ) : (
                                <div className="relative h-60 w-full rounded-lg border flex items-center justify-center overflow-hidden group">
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                                    
                                    {/* Botão Remover (Hover) */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button type="button" variant="destructive" size="icon" onClick={handleRemoveImage}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Overlay Editar (Hover) */}
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Alterar Imagem
                                        </p>
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isUploading ? "Enviando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}