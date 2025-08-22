
import React from "react";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";

type Item = {
  id: string;
  date: string;
  description: string;
  type: "entrada" | "saida";
  amount: number;
  balance: number;
};

interface CashFlowTableProps {
  data: Item[];
}

export const CashFlowTable: React.FC<CashFlowTableProps> = ({ data }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Data</TableHead>
        <TableHead>Descrição</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead className="text-right">Valor</TableHead>
        <TableHead className="text-right">Saldo</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell>{item.description}</TableCell>
          <TableCell>
            <span className={`stage-badge ${item.type === 'entrada' ? 'badge-sales' : 'badge-route'}`}>
              {item.type === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          </TableCell>
          <TableCell className={`text-right font-medium ${item.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
            {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount).replace('R$ ', '')}
          </TableCell>
          <TableCell className="text-right font-medium">
            {formatCurrency(item.balance)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

