
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from 'lucide-react';

interface Order {
  id: string | number;
  client_name?: string;
  product_name?: string;
  quantity?: number;
  delivery_deadline?: string | null;
  seller?: string;
  status?: string;
  statusType?: string;
  completed?: boolean;
  [key: string]: any;
}

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (e: React.MouseEvent, order: Order) => void;
  onEditOrder: (e: React.MouseEvent, order: Order) => void;
  onDeleteOrder: (e: React.MouseEvent, order: Order) => void;
  onOrderClick: (order: Order) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onOrderClick
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead className="text-center">Qtd</TableHead>
          <TableHead>Data Entrega</TableHead>
          <TableHead>Vendedor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow 
            key={order.id}
            className="cursor-pointer hover:bg-accent/5"
            onClick={() => onOrderClick(order)}
          >
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.client_name}</TableCell>
            <TableCell>{order.product_name}</TableCell>
            <TableCell className="text-center">{order.quantity}</TableCell>
            <TableCell>
              {order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString('pt-BR') : '-'}
            </TableCell>
            <TableCell>{order.seller || '-'}</TableCell>
            <TableCell>
              <span className={`stage-badge badge-${order.statusType || 'order'}`}>
                {order.status}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex justify-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => onViewOrder(e, order)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => onEditOrder(e, order)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" 
                  onClick={(e) => onDeleteOrder(e, order)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {orders.length === 0 && !loading && (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              Nenhum pedido encontrado.
            </TableCell>
          </TableRow>
        )}
        {loading && (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              Carregando pedidos...
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
