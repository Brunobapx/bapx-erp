
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

type Account = any;

type TableProps = {
  accounts: Account[];
  confirmReceivable: (id: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export const AccountsReceivableTable: React.FC<TableProps> = ({
  accounts, confirmReceivable, onEdit, onDelete
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Cliente</TableHead>
        <TableHead>Descrição</TableHead>
        <TableHead>NF/Documento</TableHead>
        <TableHead>Vencimento</TableHead>
        <TableHead className="text-right">Valor</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {accounts.map((account) => (
        <TableRow key={account.id}>
          <TableCell className="font-medium">{account.entry_number}</TableCell>
          <TableCell>{account.client}</TableCell>
          <TableCell>{account.description}</TableCell>
          <TableCell>{account.invoice_number || '-'}</TableCell>
          <TableCell>{new Date(account.dueDate).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell className="text-right font-medium">
            R$ {account.amount.toLocaleString('pt-BR')}
          </TableCell>
          <TableCell>
            <span className={`stage-badge ${
              account.status === 'recebido' ? 'badge-sales' : 
              account.status === 'pendente' ? 'badge-packaging' : 'badge-route'
            }`}>
              {account.status === 'recebido' ? 'Recebido' : 
               account.status === 'pendente' ? 'Pendente' : 'Vencido'}
            </span>
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              {account.status !== 'recebido' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => confirmReceivable(account.id)}
                >
                  Confirmar
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
