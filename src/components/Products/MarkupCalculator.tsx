
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MarkupCalculatorProps {
  defaultValues?: {
    cost?: number;
    fixed?: number;
    variable?: number;
    profit?: number;
  };
  onCalculate?: (markup: number, price: number) => void;
}

export const MarkupCalculator: React.FC<MarkupCalculatorProps> = ({ defaultValues, onCalculate }) => {
  const [form, setForm] = useState({
    cost: defaultValues?.cost ?? 0,
    fixed: defaultValues?.fixed ?? 0,
    variable: defaultValues?.variable ?? 0,
    profit: defaultValues?.profit ?? 0,
  });
  const [markup, setMarkup] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  React.useEffect(() => {
    if (defaultValues) {
      setForm({
        cost: defaultValues.cost ?? 0,
        fixed: defaultValues.fixed ?? 0,
        variable: defaultValues.variable ?? 0,
        profit: defaultValues.profit ?? 0,
      });
      setMarkup(null);
      setPrice(null);
    }
  }, [defaultValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: Number(e.target.value) }));
  };

  const handleCalculate = () => {
    // Verifica soma das porcentagens < 100 e valores positivos
    const percentSum = form.fixed + form.variable + form.profit;
    if (form.cost <= 0 || percentSum >= 100) { setMarkup(null); setPrice(null); return; }
    const m = 100 / (100 - percentSum);
    setMarkup(Number(m.toFixed(2)));
    const p = form.cost * m;
    setPrice(Number(p.toFixed(2)));
    onCalculate && onCalculate(Number(m.toFixed(2)), Number(p.toFixed(2)));
  };

  return (
    <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-end">
      <div>
        <Label>Custo do Produto (R$)</Label>
        <Input type="number" name="cost" value={form.cost} onChange={handleChange} min={0} step={0.01} />
      </div>
      <div>
        <Label>Despesas Fixas (%)</Label>
        <Input type="number" name="fixed" value={form.fixed} onChange={handleChange} min={0} max={99} />
      </div>
      <div>
        <Label>Despesas Variáveis (%)</Label>
        <Input type="number" name="variable" value={form.variable} onChange={handleChange} min={0} max={99} />
      </div>
      <div>
        <Label>Margem de Lucro (%)</Label>
        <Input type="number" name="profit" value={form.profit} onChange={handleChange} min={0} max={99} />
      </div>
      <div className="sm:col-span-2 flex gap-2">
        <Button type="button" onClick={handleCalculate}>Calcular Markup</Button>
        {(form.fixed + form.variable + form.profit >= 100) &&
          <span className="text-xs text-destructive">A soma das porcentagens deve ser menor que 100%</span>}
      </div>
      {(markup && price) &&
        <div className="sm:col-span-2 flex flex-col mt-2">
          <span className="font-medium">Markup: <span className="text-primary">{markup}</span></span>
          <span className="font-medium">Preço de Venda Ideal: <span className="text-green-700">{price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
        </div>
      }
    </form>
  );
};
