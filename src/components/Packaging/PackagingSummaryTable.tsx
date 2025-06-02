
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PackagingSummary } from '@/hooks/usePackagingSummary';

type PackagingSummaryTableProps = {
  summary: PackagingSummary[];
};

export const PackagingSummaryTable = ({ summary }: PackagingSummaryTableProps) => {
  if (summary.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Nenhum item pendente para embalagem.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead className="text-center">Total a Embalar</TableHead>
          <TableHead className="text-center">Qtd de Pedidos</TableHead>
          <TableHead>Detalhes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summary.map((item) => (
          <TableRow key={item.product_id}>
            <TableCell className="font-medium">{item.product_name}</TableCell>
            <TableCell className="text-center font-bold text-blue-600">
              {item.total_quantity}
            </TableCell>
            <TableCell className="text-center">{item.orders_count}</TableCell>
            <TableCell>
              <div className="space-y-1">
                {item.packaging_items.slice(0, 3).map((packItem, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    {packItem.packaging_number}: {packItem.quantity} un. - {packItem.client_name}
                  </div>
                ))}
                {item.packaging_items.length > 3 && (
                  <div className="text-xs text-muted-foreground font-medium">
                    +{item.packaging_items.length - 3} mais...
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
