
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, CalendarDays } from "lucide-react";

interface CashFlowCardsProps {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  saldoFinal: number;
}

export const CashFlowCards: React.FC<CashFlowCardsProps> = ({
  totalEntradas,
  totalSaidas,
  saldoLiquido,
  saldoFinal,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground">Total Entradas</p>
            <p className="text-lg font-bold text-green-600">R$ {totalEntradas.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm text-muted-foreground">Total Saídas</p>
            <p className="text-lg font-bold text-red-600">R$ {totalSaidas.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm text-muted-foreground">Saldo Líquido</p>
            <p className={`text-lg font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldoLiquido.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-purple-600" />
          <div>
            <p className="text-sm text-muted-foreground">Saldo Final</p>
            <p className="text-lg font-bold text-purple-600">R$ {saldoFinal.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

