
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { ProductSelector } from '../ProductSelector';
import { useProducts } from '@/hooks/useProducts';
import { OrderFormItem } from '@/hooks/orders/useOrderFormState';

interface OrderItemsSectionProps {
  items: OrderFormItem[];
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<OrderFormItem>) => void;
}

export const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem
}) => {
  const { products } = useProducts();
  const safeProducts = React.useMemo(() => {
    if (!Array.isArray(products)) {
      return [];
    }
    return products;
  }, [products]);

  const handleProductSelect = (itemId: string, productId: string, productName: string, productPrice?: number) => {
    onUpdateItem(itemId, {
      product_id: productId,
      product_name: productName,
      unit_price: productPrice || 0
    });
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    onUpdateItem(itemId, { quantity });
  };

  const handlePriceChange = (itemId: string, unit_price: number) => {
    onUpdateItem(itemId, { unit_price });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Itens do Pedido *</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <p>Nenhum item adicionado</p>
          <p className="text-sm">Clique em "Adicionar Item" para começar</p>
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Item {index + 1}</Label>
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`product-${item.id}`}>Produto *</Label>
              <ProductSelector
                products={safeProducts}
                selectedProductId={item.product_id}
                selectedProductName={item.product_name}
                onProductSelect={(productId, productName, productPrice) => 
                  handleProductSelect(item.id, productId, productName, productPrice)
                }
                open={false}
                setOpen={() => {}}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`quantity-${item.id}`}>Quantidade *</Label>
                <Input
                  id={`quantity-${item.id}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`price-${item.id}`}>Preço Unitário</Label>
                <Input
                  id={`price-${item.id}`}
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Total do Item</Label>
                <div className="p-2 border rounded bg-gray-50 font-medium">
                  {formatCurrency(item.total_price)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
