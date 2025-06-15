
import React from "react";
import { MarkupSettings } from "./MarkupSettings";
import { MarkupCalculator } from "./MarkupCalculator";
import { useMarkupSettings } from "@/hooks/useMarkupSettings";
import { Card, CardContent } from "@/components/ui/card";

export const MarkupTab: React.FC = () => {
  const { settings, loading } = useMarkupSettings();

  return (
    <div className="space-y-4">
      <MarkupSettings />
      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-bold mb-4">Calculadora de Markup</h2>
          <MarkupCalculator defaultValues={{
            fixed: settings?.fixed_expenses_percentage ?? 0,
            variable: settings?.variable_expenses_percentage ?? 0,
            profit: settings?.default_profit_margin ?? 0,
          }} />
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Fórmula: <code>Markup = 100 / [100 - (Despesas Fixas % + Despesas Variáveis % + Margem Lucro %)]</code></p>
            <p>Preço de Venda Ideal = Custo × Markup</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
