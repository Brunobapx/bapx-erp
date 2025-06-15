
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FinanceOverviewTableProps {
  items: any[];
  onItemClick: (item: any) => void;
}

export const FinanceOverviewTable: React.FC<FinanceOverviewTableProps> = ({
  items,
  onItemClick,
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Descrição</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead className="text-right">Valor (R$)</TableHead>
        <TableHead>Vencimento</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Pagamento</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow
          key={item.id}
          className="cursor-pointer hover:bg-accent/5"
          onClick={() => onItemClick(item)}
        >
          <TableCell className="font-medium">{item.entry_number}</TableCell>
          <TableCell>{item.description}</TableCell>
          <TableCell>
            <span className={`stage-badge ${item.type === 'receivable' ? 'badge-sales' : 'badge-route'}`}>
              {item.type === 'receivable' ? 'Receita' : 'Despesa'}
            </span>
          </TableCell>
          <TableCell className="text-right">{Number(item.amount).toLocaleString('pt-BR')}</TableCell>
          <TableCell>{new Date(item.due_date).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell>
            <span className="stage-badge badge-finance">
              {item.payment_status === 'paid' ? 'Pago' :
                item.payment_status === 'pending' ? 'Pendente' :
                  item.payment_status === 'overdue' ? 'Vencido' : 'Cancelado'}
            </span>
          </TableCell>
          <TableCell>
            {item.payment_date ? new Date(item.payment_date).toLocaleDateString('pt-BR') : '-'}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
