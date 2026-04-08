import { type Control, useFieldArray, useWatch, Controller } from "react-hook-form";
import { Plus, Trash2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StreetList } from "./StreetList";
import type { TerritoryFormValues } from "@/hooks/territories/useTerritoryDialog";

interface BlockListProps {
    control: Control<TerritoryFormValues>;
}

export function BlockList({ control }: BlockListProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "blocks",
    });

    return (
        <div className="space-y-4 col-span-4">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                    <Map className="w-4 h-4" /> Quadras e Ruas
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => append({ id: crypto.randomUUID(), number: "", streets: [] })}
                >
                    <Plus className="w-4 h-4 mr-2" /> Nova Quadra
                </Button>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
                {fields.map((item, index) => (
                    <BlockItem 
                        key={item.id} 
                        index={index} 
                        control={control} 
                        onRemove={() => remove(index)} 
                    />
                ))}
            </Accordion>

            {fields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    Nenhuma quadra cadastrada. Adicione para detalhar as ruas.
                </div>
            )}
        </div>
    );
}

function BlockItem({ index, control, onRemove }: { index: number, control: Control<TerritoryFormValues>, onRemove: () => void }) {
    const blockNumber = useWatch({
        control,
        name: `blocks.${index}.number`,
    });

    return (
        <AccordionItem value={`item-${index}`} className="border rounded-lg px-2">
            <div className="flex items-center py-2 gap-5">
                <AccordionTrigger className="flex-1 py-2 hover:no-underline px-2">
                    <span className="font-medium text-sm">
                        {blockNumber ? `Quadra ${blockNumber}` : `Quadra #${index + 1}`}
                    </span>
                </AccordionTrigger>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={onRemove}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <AccordionContent className="px-2 pb-4">
                <div className="space-y-4">
                    
                    {/* Campo: Identificação da Quadra */}
                    <Controller
                        control={control}
                        name={`blocks.${index}.number`}
                        render={({ field, fieldState }) => (
                            <Field className="flex flex-col gap-2" data-invalid={fieldState.invalid}>
                                <FieldLabel className="text-xs">Identificação da Quadra</FieldLabel>
                                <Input 
                                    placeholder="Ex: Q1 ou Bloco A" 
                                    {...field}
                                    aria-invalid={fieldState.invalid} 
                                />
                                {fieldState.error && (
                                    <FieldError>{fieldState.error.message}</FieldError>
                                )}
                            </Field>
                        )}
                    />

                    <StreetList nestIndex={index} control={control} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}