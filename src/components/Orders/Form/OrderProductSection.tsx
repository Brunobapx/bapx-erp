
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
  const { products } = useProducts();

  // Ensure products is always a valid array
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="grid gap-2">
      <Label htmlFor="product">Produto *</Label>
      <ProductSelector 
        products={safeProducts}
        selectedProductId={selectedProductId}
        selectedProductName={selectedProductName}
        onProductSelect={onProductSelect}
        open={openProductCombobox}
        setOpen={setOpenProductCombobox}
      />
    </div>
  );
};
