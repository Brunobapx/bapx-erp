
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
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Edit, Trash2, Factory, XCircle } from 'lucide-react';
import { Order } from '@/hooks/useOrders';
import { useAuth } from '@/components/Auth/AuthProvider';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (e: React.MouseEvent, order: Order) => void;
  onEditOrder: (e: React.MouseEvent, order: Order) => void;
  onDeleteOrder: (e: React.MouseEvent, order: Order) => void;
  onOrderClick: (order: Order) => void;
  onSendToProduction?: (e: React.MouseEvent, order: Order) => void;
  onCancelOrder?: (e: React.MouseEvent, order: Order) => void;
  translateStatus: (status: string) => string;
  showCheckboxes?: boolean;
  selectedOrders?: string[];
  onOrderSelect?: (orderId: string, selected: boolean) => void;
  hasDirectSaleProduct?: (order: Order) => boolean;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onOrderClick,
  onSendToProduction,
  onCancelOrder,
  translateStatus,
  showCheckboxes = false,
  selectedOrders = [],
  onOrderSelect,
  hasDirectSaleProduct
}) => {
  const { isAdmin } = useAuth();
  const getFirstOrderItem = (order: Order) => {
    return order.order_items?.[0] || null;
  };

  const getStatusType = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'order',
      'in_production': 'production',
      'in_packaging': 'packaging',
      'packaged': 'packaging',
      'released_for_sale': 'sale',
      'sale_confirmed': 'sale',
      'in_delivery': 'delivery',
      'delivered': 'delivery',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'order';
  };

  const canSendToProduction = (order: Order) => {
    if (order.status !== 'pending') return false;
    // Se o pedido tem produto de venda direta, não pode enviar para produção
    if (hasDirectSaleProduct && hasDirectSaleProduct(order)) return false;
    return true;
  };

  const canCancelOrder = (order: Order) => {
    return !['cancelled', 'delivered', 'in_delivery'].includes(order.status);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCheckboxes && <TableHead className="w-12">Sel.</TableHead>}
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
        {orders.map((order) => {
          const firstItem = getFirstOrderItem(order);
          return (
            <TableRow 
              key={order.id}
              className="cursor-pointer hover:bg-accent/5"
              onClick={() => onOrderClick(order)}
            >
              {showCheckboxes && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => 
                      onOrderSelect?.(order.id, checked as boolean)
                    }
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>{order.client_name}</TableCell>
              <TableCell>{firstItem?.product_name || 'N/A'}</TableCell>
              <TableCell className="text-center">{firstItem?.quantity || 0}</TableCell>
              <TableCell>
                {order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell>{order.seller_name || '-'}</TableCell>
              <TableCell>
                <span className={`stage-badge badge-${getStatusType(order.status)}`}>
                  {translateStatus(order.status)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={(e) => onViewOrder(e, order)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={(e) => onEditOrder(e, order)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canSendToProduction(order) && onSendToProduction && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100" 
                      onClick={(e) => onSendToProduction(e, order)}
                      title="Enviar para Produção"
                    >
                      <Factory className="h-4 w-4" />
                    </Button>
                   )}
                   {canCancelOrder(order) && onCancelOrder && (
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-100" 
                       onClick={(e) => onCancelOrder(e, order)}
                       title="Cancelar Pedido"
                     >
                       <XCircle className="h-4 w-4" />
                     </Button>
                   )}
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" 
                     onClick={(e) => onDeleteOrder(e, order)}
                     title="Excluir"
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {orders.length === 0 && !loading && (
          <TableRow>
            <TableCell colSpan={showCheckboxes ? 9 : 8} className="h-24 text-center">
              Nenhum pedido encontrado.
            </TableCell>
          </TableRow>
        )}
        {loading && (
          <TableRow>
            <TableCell colSpan={showCheckboxes ? 9 : 8} className="h-24 text-center">
              Carregando pedidos...
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
