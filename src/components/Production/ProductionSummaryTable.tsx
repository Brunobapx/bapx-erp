
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductionSummary } from '@/types/production';

type ProductionSummaryTableProps = {
  productionSummary: ProductionSummary[];
  loading: boolean;
};

export const ProductionSummaryTable = ({
  productionSummary,
  loading
}: ProductionSummaryTableProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Quantidade Total</TableHead>
                <TableHead className="text-center">Nº de Pedidos</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionSummary.map((summary) => (
                <TableRow key={summary.product_id}>
                  <TableCell className="font-medium">{summary.product_name}</TableCell>
                  <TableCell className="text-center font-bold text-lg">{summary.total_quantity}</TableCell>
                  <TableCell className="text-center">{summary.orders_count}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {summary.production_items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.production_number}</span>
                          <span className="font-medium">{item.quantity} un</span>
                        </div>
                      ))}
                      {summary.production_items.length > 3 && (
                        <div className="text-xs text-center pt-1">
                          +{summary.production_items.length - 3} mais...
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && productionSummary.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma produção pendente ou em andamento encontrada.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
