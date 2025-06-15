
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMarkupSettings } from "@/hooks/useMarkupSettings";
import { Label } from "@/components/ui/label";

export const MarkupSettings: React.FC = () => {
  const { settings, loading, saveSettings } = useMarkupSettings();
  const [form, setForm] = useState({
    fixed: settings?.fixed_expenses_percentage ?? 0,
    variable: settings?.variable_expenses_percentage ?? 0,
    profit: settings?.default_profit_margin ?? 0,
  });

  React.useEffect(() => {
    setForm({
      fixed: settings?.fixed_expenses_percentage ?? 0,
      variable: settings?.variable_expenses_percentage ?? 0,
      profit: settings?.default_profit_margin ?? 0,
    });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: Number(e.target.value) }));
  };

  const handleSave = () => {
    if (form.fixed < 0 || form.variable < 0 || form.profit < 0) return;
    if (form.fixed + form.variable + form.profit >= 100) return;
    saveSettings({
      fixed_expenses_percentage: form.fixed,
      variable_expenses_percentage: form.variable,
      default_profit_margin: form.profit,
    });
  };

  return (
    <div className="border rounded-md p-4 bg-muted/25 mb-4">
      <h4 className="font-semibold mb-2">Parâmetros Padrão para Cálculo</h4>
      <div className="grid grid-cols-3 gap-4 mb-2">
        <div>
          <Label>Despesas Fixas (%)</Label>
          <Input name="fixed" type="number" min={0} max={99}
            value={form.fixed}
            onChange={handleChange} />
        </div>
        <div>
          <Label>Despesas Variáveis (%)</Label>
          <Input name="variable" type="number" min={0} max={99}
            value={form.variable}
            onChange={handleChange} />
        </div>
        <div>
          <Label>Margem Lucro (%)</Label>
          <Input name="profit" type="number" min={0} max={99}
            value={form.profit}
            onChange={handleChange} />
        </div>
      </div>
      <Button size="sm" onClick={handleSave} disabled={loading}>
        Salvar Parâmetros
      </Button>
      {(form.fixed + form.variable + form.profit >= 100) &&
        <div className="text-xs text-destructive mt-1">A soma das porcentagens deve ser menor que 100%</div>
      }
    </div>
  );
};
