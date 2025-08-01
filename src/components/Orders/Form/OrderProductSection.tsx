import React from 'react';
import { Label } from "@/components/ui/label";
import { ProductSelector } from '../ProductSelector';
import { useProducts } from '@/hooks/useProducts';

interface OrderProductSectionProps {
  selectedProductId: string;
  selectedProductName: string;
  onProductSelect: (productId: string, productName: string, productPrice?: number) => void;
  openProductCombobox: boolean;
  setOpenProductCombobox: (open: boolean) => void;
}

export const OrderProductSection: React.FC<OrderProductSectionProps> = ({
  selectedProductId,
  selectedProductName,
  onProductSelect,
  openProductCombobox,
  setOpenProductCombobox
}) => {
  const { products: allProducts } = useProducts();

  // Filtrar apenas produtos ativos para pedidos e adicionar info de estoque
  const products = React.useMemo(() => {
    return allProducts.filter((product: any) => {
      // Só incluir produtos ativos (is_active === true)
      return product.is_active === true;
    }).map((product: any) => ({
      ...product,
      // Adicionar informação de estoque no nome para visualização
      displayName: `${product.name}${product.stock !== undefined ? ` (Estoque: ${product.stock})` : ''}`
    }));
  }, [allProducts]);

  // Garantir que products é sempre um array válido e nunca undefined
  const safeProducts = React.useMemo(() => {
    if (!Array.isArray(products)) {
      console.log("OrderProductSection: products is not an array, defaulting to empty array");
      return [];
    }
    return products;
  }, [products]);

  console.log("OrderProductSection: safeProducts count:", safeProducts.length);

  return (
    <div className="grid gap-2">
      <Label htmlFor="product">Produto *</Label>
      <ProductSelector 
        products={safeProducts}
        selectedProductId={selectedProductId || ''}
        selectedProductName={selectedProductName || ''}
        onProductSelect={onProductSelect}
        open={openProductCombobox}
        setOpen={setOpenProductCombobox}
      />
    </div>
  );
};