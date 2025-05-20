
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TransactionListProps {
  onItemClick: (item: any) => void;
  pendingOrders: any[];
}

const TransactionList: React.FC<TransactionListProps> = ({ onItemClick, pendingOrders = [] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Pendentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => onItemClick(order)}
                >
                  <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>{order.product_name}</TableCell>
                  <TableCell>R$ {(parseFloat(order.quantity) * 100).toFixed(2)}</TableCell>
                  <TableCell>{order.payment_method || 'Não especificado'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800">
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhuma transação pendente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
