import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';

export interface CommissionData {
  id: string;
  sale_number: string;
  order_number: string;
  client_name: string;
  seller_name: string;
  sale_date: string;
  total_amount: number;
  commission_amount: number;
  commission_percentage: number;
  status: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    commission_type: string;
    commission_value: number;
    calculated_commission: number;
  }[];
}

interface CommissionTableProps {
  commissions: CommissionData[];
  loading: boolean;
}

export const CommissionTable: React.FC<CommissionTableProps> = ({
  commissions,
  loading
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatório de comissões...</p>
        </CardContent>
      </Card>
    );
  }

  if (commissions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhuma venda encontrada para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="secondary">Confirmada</Badge>;
      case 'invoiced':
        return <Badge variant="default">Faturada</Badge>;
      default:
        return <Badge variant="destructive">Pendente</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor Venda</TableHead>
                <TableHead className="text-right">% Comissão</TableHead>
                <TableHead className="text-right">Valor Comissão</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-medium">
                    {commission.sale_number}
                  </TableCell>
                  <TableCell>{commission.order_number}</TableCell>
                  <TableCell>{commission.client_name}</TableCell>
                  <TableCell>{commission.seller_name}</TableCell>
                  <TableCell>
                    {new Date(commission.sale_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {commission.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {commission.commission_percentage.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    R$ {commission.commission_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(commission.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};