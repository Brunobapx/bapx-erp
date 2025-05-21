
import React from 'react';
import { Label } from "@/components/ui/label";
import { ProductSelector } from '../ProductSelector';
import { Product } from '@/hooks/useProducts';

interface OrderProductSectionProps {
  selectedProductId: string;
  selectedProductName: string;
  onProductSelect: (productId: string, productName: string, productPrice?: number) => void;
  products: Product[];
  openProductCombobox: boolean;
  setOpenProductCombobox: (open: boolean) => void;
}

export const OrderProductSection: React.FC<OrderProductSectionProps> = ({
  selectedProductId,
  selectedProductName,
  onProductSelect,
  products,
  openProductCombobox,
  setOpenProductCombobox
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="product">Produto *</Label>
      <ProductSelector 
        products={products}
        selectedProductId={selectedProductId}
        selectedProductName={selectedProductName}
        onProductSelect={onProductSelect}
        open={openProductCombobox}
        setOpen={setOpenProductCombobox}
      />
    </div>
  );
};
