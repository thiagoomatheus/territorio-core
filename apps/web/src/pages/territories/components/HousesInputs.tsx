import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface House {
  id: string;
  number: string;
  visited: boolean;
}

interface HousesInputProps {
  value: House[];
  onChange: (value: House[]) => void;
}

export function HousesInput({ value = [], onChange }: HousesInputProps) {

    const [textValue, setTextValue] = useState(() => value.map(h => h.number).join(",").trim());
    
    useEffect(() => {
        setTextValue(value.map(h => h.number).join(", "));
    }, [value]);

    const handleBlur = () => {
        
        const numbers = textValue.split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

        const newHouses = numbers.map(num => ({
            id: crypto.randomUUID(),
            number: num,
            visited: false
        }));

        onChange(newHouses);
    };

    return (
        <div className="space-y-1">
            <Input
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={handleBlur}
                placeholder="Ex: 10, 12, 14A, 16 (Separados por vírgula)"
            />
            <div className="flex flex-wrap gap-1 mt-2">
                {value.map((h) => (
                    <Badge key={h.id} className="text-xs">
                        {h.number}
                    </Badge>
                ))}
            </div>
        </div>
    );
}