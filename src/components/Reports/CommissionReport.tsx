import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommissionFilters } from './CommissionFilters';
import { CommissionTable } from './CommissionTable';
import { useCommissionReport } from '@/hooks/useCommissionReport';

export const CommissionReport = () => {
  const {
    commissions,
    loading,
    filters,
    updateFilters,
    totalCommissions,
    totalSales
  } = useCommissionReport();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Comissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CommissionFilters
            filters={filters}
            onFiltersChange={updateFilters}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total de Vendas</div>
                <div className="text-2xl font-bold">
                  R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total de Comissões</div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">% Comissão Média</div>
                <div className="text-2xl font-bold">
                  {totalSales > 0 ? ((totalCommissions / totalSales) * 100).toFixed(2) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>
          
          <CommissionTable
            commissions={commissions}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};