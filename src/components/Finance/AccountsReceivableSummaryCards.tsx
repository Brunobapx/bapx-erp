
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import React from "react";

type Props = {
  totalRecebido: number;
  totalPendente: number;
  totalVencido: number;
};

export const AccountsReceivableSummaryCards: React.FC<Props> = ({
  totalRecebido,
  totalPendente,
  totalVencido,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground">Recebidas</p>
            <p className="text-lg font-bold text-green-600">R$ {totalRecebido.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className="border-l-4 border-l-yellow-500">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-lg font-bold text-yellow-600">R$ {totalPendente.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className="border-l-4 border-l-red-500">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm text-muted-foreground">Vencidas</p>
            <p className="text-lg font-bold text-red-600">R$ {totalVencido.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
