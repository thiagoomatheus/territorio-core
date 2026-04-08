import { Controller, useFieldArray, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HousesInput } from "./HousesInputs";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { TerritoryFormValues } from "@/hooks/territories/useTerritoryDialog";

interface StreetListProps {
    nestIndex: number;
    control: Control<TerritoryFormValues>;
}

export function StreetList({ nestIndex, control }: StreetListProps) {

    const { fields, append, remove } = useFieldArray({
        control,
        name: `blocks.${nestIndex}.streets`,
    });

    return (
        <div className="space-y-3 pl-4 border-l-2 border-gray-100 ml-1 mt-2">
            {fields.map((item, k) => (
                <div key={item.id} className="p-3 border rounded-md shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex justify-between items-start gap-3">
                            {/* Campo: Nome da Rua */}
                            <div className="flex-1">
                                <Controller
                                    control={control}
                                    name={`blocks.${nestIndex}.streets.${k}.name`}
                                    render={({ field, fieldState }) => (
                                        <Field className="flex flex-col gap-2" data-invalid={fieldState.invalid}>
                                            <FieldLabel className="text-xs text-muted-foreground">Nome da Rua</FieldLabel>
                                            <Input 
                                                placeholder="Ex: Rua das Flores" 
                                                {...field} 
                                                aria-invalid={fieldState.invalid}
                                            />
                                            {fieldState.error && (
                                                <FieldError>{fieldState.error.message}</FieldError>
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-500 h-8 w-8 mt-6"
                                onClick={() => remove(k)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Campo: Casas (HousesInput) */}
                    <Controller
                        control={control}
                        name={`blocks.${nestIndex}.streets.${k}.houses`}
                        render={({ field, fieldState }) => (
                            <Field className="flex flex-col gap-2" data-invalid={fieldState.invalid}>
                                <FieldLabel className="text-xs text-muted-foreground">Casas (Nº)</FieldLabel>
                                
                                <HousesInput value={field.value} onChange={field.onChange} />
                                
                                <p className="text-[10px] text-muted-foreground">
                                    Digite os números separados por vírgula.
                                </p>
                                {fieldState.error && (
                                    <FieldError>{fieldState.error.message}</FieldError>
                                )}
                            </Field>
                        )}
                    />
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed text-muted-foreground hover:text-primary"
                onClick={() => append({ id: crypto.randomUUID(), name: "", houses: [] })}
            >
                <Plus className="w-3 h-3 mr-2" /> Adicionar Rua
            </Button>
        </div>
    );
}