
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Frequencia = "mensal" | "quinzenal" | "anual";

type PayableRecurrenceFieldsProps = {
  recorrente: boolean;
  setRecorrente: (checked: boolean) => void;
  frequencia: Frequencia;
  setFrequencia: (value: Frequencia) => void;
  qtdRepeticoes: number;
  setQtdRepeticoes: (value: number) => void;
};

export const PayableRecurrenceFields: React.FC<PayableRecurrenceFieldsProps> = ({
  recorrente,
  setRecorrente,
  frequencia,
  setFrequencia,
  qtdRepeticoes,
  setQtdRepeticoes
}) => (
  <>
    <div className="flex items-center gap-2 mt-2">
      <Switch checked={recorrente} onCheckedChange={setRecorrente} id="recorrente"/>
      <Label htmlFor="recorrente">Conta Recorrente?</Label>
    </div>
    {recorrente && (
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="freq">Frequência</Label>
          <Select value={frequencia} onValueChange={v => setFrequencia(v as Frequencia)}>
            <SelectTrigger id="freq">
              <SelectValue placeholder="Frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="quinzenal">Quinzenal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="repeticoes">Nº de repetições</Label>
          <Input
            id="repeticoes"
            type="number"
            min={1}
            value={qtdRepeticoes}
            onChange={e => setQtdRepeticoes(Number(e.target.value))}
            disabled={!recorrente}
          />
        </div>
      </div>
    )}
  </>
);

export default PayableRecurrenceFields;
