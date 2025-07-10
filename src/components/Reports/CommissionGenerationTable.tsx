import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';
import { CommissionData } from './CommissionTable';

interface CommissionGenerationTableProps {
  commissions: CommissionData[];
  loading: boolean;
  selectedCommissions: string[];
  onSelectionChange: (commissionId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onGenerateCommissions: () => void;
  selectedTotal: number;
}

export const CommissionGenerationTable: React.FC<CommissionGenerationTableProps> = ({
  commissions,
  loading,
  selectedCommissions,
  onSelectionChange,
  onSelectAll,
  onClearAll,
  onGenerateCommissions,
  selectedTotal
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

  const allSelected = commissions.length > 0 && selectedCommissions.length === commissions.length;
  const someSelected = selectedCommissions.length > 0 && selectedCommissions.length < commissions.length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectAll();
              } else {
                onClearAll();
              }
            }}
          />
          <span className="text-sm text-muted-foreground">
            {selectedCommissions.length} de {commissions.length} selecionados
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {selectedCommissions.length > 0 && (
            <div className="text-sm font-medium">
              Total selecionado: R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          <Button
            onClick={onGenerateCommissions}
            disabled={selectedCommissions.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Gerar Comissões ({selectedCommissions.length})
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectAll();
                        } else {
                          onClearAll();
                        }
                      }}
                    />
                  </TableHead>
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
                    <TableCell>
                      <Checkbox
                        checked={selectedCommissions.includes(commission.id)}
                        onCheckedChange={(checked) => 
                          onSelectionChange(commission.id, checked as boolean)
                        }
                      />
                    </TableCell>
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
                      R$ {commission.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div>
  );
};