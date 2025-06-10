
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';

export const SaasAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Analytics e Métricas</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uso por Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em desenvolvimento - Relatórios de uso por módulo serão exibidos aqui.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em desenvolvimento - Gráficos de crescimento serão exibidos aqui.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retenção de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em desenvolvimento - Métricas de retenção serão exibidas aqui.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em desenvolvimento - Métricas de performance serão exibidas aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
