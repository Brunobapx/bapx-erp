
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface FinanceHeaderProps {
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  onNewEntry: () => void;
}

export const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  saldo,
  totalReceitas,
  totalDespesas,
  onNewEntry,
}) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold">Financeiro</h1>
      <p className="text-muted-foreground">Gerencie todos os aspectos financeiros da empresa.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Card className="bg-sales/10">
        <CardContent className="flex items-center gap-2 p-2">
          <ArrowUp className="h-5 w-5 text-sales" />
          <div>
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="font-bold text-sales">{formatCurrency(totalReceitas)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-erp-alert/10">
        <CardContent className="flex items-center gap-2 p-2">
          <ArrowDown className="h-5 w-5 text-erp-alert" />
          <div>
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="font-bold text-erp-alert">{formatCurrency(totalDespesas)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className={`${saldo >= 0 ? 'bg-sales/10' : 'bg-erp-alert/10'}`}>
        <CardContent className="flex items-center gap-2 p-2">
          <TrendingUp className={`h-5 w-5 ${saldo >= 0 ? 'text-sales' : 'text-erp-alert'}`} />
          <div>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`font-bold ${saldo >= 0 ? 'text-sales' : 'text-erp-alert'}`}>
              {formatCurrency(saldo)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Button onClick={onNewEntry}>
        <DollarSign className="mr-2 h-4 w-4" /> Novo Lançamento
      </Button>
    </div>
  </div>
);
