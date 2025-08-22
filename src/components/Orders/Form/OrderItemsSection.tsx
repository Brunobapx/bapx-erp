
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductSelector } from '../ProductSelector';
import { useProducts } from '@/hooks/useProducts';
import { OrderFormItem } from '@/hooks/orders/useOrderFormState';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderItemsSectionProps {
  items: OrderFormItem[];
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<OrderFormItem>) => void;
  openProductCombobox: Record<string, boolean>;
  setOpenProductCombobox: (itemId: string, open: boolean) => void;
}

export const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  openProductCombobox,
  setOpenProductCombobox
}) => {
  const { products: allProducts } = useProducts();
  const isMobile = useIsMobile();
  
  // Filtrar apenas produtos ativos para pedidos
  const products = React.useMemo(() => {
    return allProducts.filter((product: any) => {
      // Só incluir produtos ativos (is_active === true)
      return product.is_active === true;
    });
  }, [allProducts]);
  
  const safeProducts = React.useMemo(() => {
    if (!Array.isArray(products)) {
      return [];
    }
    return products;
  }, [products]);

  const handleProductSelect = (itemId: string, productId: string, productName: string, productPrice?: number) => {
    const selectedProduct = safeProducts.find(p => p.id === productId);
    const price = selectedProduct?.price || productPrice || 0;
    
    onUpdateItem(itemId, {
      product_id: productId,
      product_name: productName,
      unit_price: price
    });
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity > 0) {
      onUpdateItem(itemId, { quantity });
    }
  };

  // Preço não é mais editável, vem sempre do cadastro do produto

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const canRemoveItem = items.length > 1;

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

      {items.length > 0 && (
        <>
          {/* Layout para Desktop */}
          {!isMobile && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Produto</TableHead>
                    <TableHead className="w-[12%]">Estoque</TableHead>
                    <TableHead className="w-[13%]">Quantidade</TableHead>
                    <TableHead className="w-[18%]">Preço Unit.</TableHead>
                    <TableHead className="w-[17%]">Total</TableHead>
                    <TableHead className="w-[5%]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const selectedProduct = safeProducts.find(p => p.id === item.product_id);
                    const currentStock = selectedProduct?.stock || 0;
                    const isLowStock = currentStock < item.quantity;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <ProductSelector
                            products={safeProducts}
                            selectedProductId={item.product_id}
                            selectedProductName={item.product_name}
                            onProductSelect={(productId, productName, productPrice) => 
                              handleProductSelect(item.id, productId, productName, productPrice)
                            }
                            open={openProductCombobox[item.id] || false}
                            setOpen={(open) => setOpenProductCombobox(item.id, open)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                            {currentStock.toLocaleString('pt-BR')}
                            {selectedProduct?.unit && (
                              <span className="text-xs text-gray-500 ml-1">{selectedProduct.unit}</span>
                            )}
                          </div>
                          {isLowStock && (
                            <div className="text-xs text-red-500">Estoque insuficiente</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                            className={`w-full ${isLowStock ? 'border-red-300 focus:border-red-500' : ''}`}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-blue-700 bg-blue-50 p-2 rounded border">
                            {formatCurrency(item.unit_price)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-700">
                            {formatCurrency(item.total_price)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {canRemoveItem && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700 p-2"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Layout para Mobile */}
          {isMobile && (
            <div className="space-y-4">
              {items.map((item, index) => {
                const selectedProduct = safeProducts.find(p => p.id === item.product_id);
                const currentStock = selectedProduct?.stock || 0;
                const isLowStock = currentStock < item.quantity;
                
                return (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    {/* Linha 1: Produto e ações */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-1 block">Produto</Label>
                        <ProductSelector
                          products={safeProducts}
                          selectedProductId={item.product_id}
                          selectedProductName={item.product_name}
                          onProductSelect={(productId, productName, productPrice) => 
                            handleProductSelect(item.id, productId, productName, productPrice)
                          }
                          open={openProductCombobox[item.id] || false}
                          setOpen={(open) => setOpenProductCombobox(item.id, open)}
                        />
                      </div>
                      {canRemoveItem && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-2 mt-5"
                          title="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Linha 2: Estoque */}
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Estoque</Label>
                      <div className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {currentStock.toLocaleString('pt-BR')}
                        {selectedProduct?.unit && (
                          <span className="text-xs text-gray-500 ml-1">{selectedProduct.unit}</span>
                        )}
                      </div>
                      {isLowStock && (
                        <div className="text-xs text-red-500">Estoque insuficiente</div>
                      )}
                    </div>

                    {/* Linha 3: Quantidade, Preço Unit. e Total */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm font-medium mb-1 block">Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                          className={`w-full ${isLowStock ? 'border-red-300 focus:border-red-500' : ''}`}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1 block">Preço Unit.</Label>
                        <div className="text-sm font-medium text-blue-700 bg-blue-50 p-2 rounded border text-center">
                          {formatCurrency(item.unit_price)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1 block">Total</Label>
                        <div className="font-medium text-green-700 p-2 border rounded bg-green-50 text-center">
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
