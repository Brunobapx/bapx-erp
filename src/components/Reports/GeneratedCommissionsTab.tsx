import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from 'lucide-react';
import { useGeneratedCommissions } from '@/hooks/useGeneratedCommissions';

export const GeneratedCommissionsTab = () => {
  const {
    commissionPayments,
    loading,
    cancelCommissionPayment
  } = useGeneratedCommissions();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">Pendente</Badge>;
      case 'paid':
        return <Badge variant="default">Pago</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando comissões geradas...</p>
        </CardContent>
      </Card>
    );
  }

  if (commissionPayments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhuma comissão foi gerada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões Geradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Data Geração</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Qtd. Vendas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.payment_number}
                    </TableCell>
                    <TableCell>{payment.seller_name}</TableCell>
                    <TableCell>
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      R$ {payment.total_commission.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(payment.order_ids) ? payment.order_ids.length : 0} vendas
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar modal de detalhes
                            console.log('Ver detalhes:', payment);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelCommissionPayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};