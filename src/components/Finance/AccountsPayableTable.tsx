
import React from "react";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash, Pencil } from "lucide-react";

type AccountPayable = {
  id: string;
  supplier_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  category: string;
  invoice_number?: string;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
};

interface AccountsPayableTableProps {
  accounts: AccountPayable[];
  onPay: (id: string) => void;
  onEdit: (account: AccountPayable) => void;
  onDelete: (account: AccountPayable) => void;
}

export const AccountsPayableTable: React.FC<AccountsPayableTableProps> = ({
  accounts, onPay, onEdit, onDelete
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Fornecedor</TableHead>
        <TableHead>Descrição</TableHead>
        <TableHead>NF</TableHead>
        <TableHead>Categoria</TableHead>
        <TableHead>Vencimento</TableHead>
        <TableHead className="text-right">Valor</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {accounts.map((account) => (
        <TableRow key={account.id}>
          <TableCell className="font-medium">{account.supplier_name}</TableCell>
          <TableCell>{account.description}</TableCell>
          <TableCell>{account.invoice_number || '-'}</TableCell>
          <TableCell>{account.category}</TableCell>
          <TableCell>{new Date(account.due_date).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell className="text-right font-medium">
            R$ {account.amount.toLocaleString('pt-BR')}
          </TableCell>
          <TableCell>
            <span className={`stage-badge ${
              account.status === 'overdue' ? 'badge-route' : 
              account.status === 'pending' ? 'badge-packaging' : 
              account.status === 'paid' ? 'badge-sales' : 'badge-finance'
            }`}>
              {account.status === 'overdue' ? 'Vencido' : 
                account.status === 'pending' ? 'Pendente' : 
                account.status === 'paid' ? 'Pago' : 'Cancelado'}
            </span>
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              {(account.status === 'pending' || account.status === 'overdue') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPay(account.id)}
                >
                  Pagar
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onEdit(account)}
                aria-label="Editar"
              >
                <Pencil className="text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onDelete(account)}
                aria-label="Excluir"
              >
                <Trash className="text-erp-alert" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

