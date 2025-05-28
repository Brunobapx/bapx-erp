
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, X } from 'lucide-react';
import { Order } from '@/hooks/useOrders';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onEdit: (order: Order) => void;
  translateStatus: (status: string) => string;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onEdit,
  translateStatus
}) => {
  if (!order) return null;

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEdit = () => {
    onEdit(order);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Detalhes do Pedido {order.order_number}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8"
              title="Editar pedido"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Cliente</label>
              <p className="text-sm font-semibold">{order.client_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-sm font-semibold">{translateStatus(order.status)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Data de Entrega</label>
              <p className="text-sm">
                {order.delivery_deadline 
                  ? new Date(order.delivery_deadline).toLocaleDateString('pt-BR')
                  : 'Não definida'
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Vendedor</label>
              <p className="text-sm">{order.seller || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Método de Pagamento</label>
              <p className="text-sm">{order.payment_method || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Prazo de Pagamento</label>
              <p className="text-sm">{order.payment_term || 'Não informado'}</p>
            </div>
          </div>

          {/* Items do pedido */}
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Itens do Pedido</label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Produto</th>
                    <th className="px-4 py-2 text-center">Qtd</th>
                    <th className="px-4 py-2 text-right">Preço Unit.</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items?.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 font-semibold text-right">Total Geral:</td>
                    <td className="px-4 py-2 font-bold text-right text-green-600">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observações */}
          {order.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Observações</label>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Criado em: </span>
              {order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Atualizado em: </span>
              {order.updated_at ? new Date(order.updated_at).toLocaleString('pt-BR') : 'N/A'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
