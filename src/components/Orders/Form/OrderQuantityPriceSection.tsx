
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface OrderQuantityPriceSectionProps {
  quantity: number | string;
  unitPrice: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  formattedTotal: string;
}

export const OrderQuantityPriceSection: React.FC<OrderQuantityPriceSectionProps> = ({
  quantity,
  unitPrice,
  onChange,
  onBlur,
  formattedTotal
}) => {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input 
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={onChange}
            required
            onBlur={onBlur}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="unit_price">Preço Unitário</Label>
          <Input 
            id="unit_price"
            name="unit_price"
            type="number"
            step="0.01"
            value={unitPrice}
            onChange={onChange}
            onBlur={onBlur}
          />
        </div>
      </div>

      <div className="grid gap-1">
        <Label>Valor Total</Label>
        <div className="text-lg font-medium p-2 border rounded bg-gray-50">{formattedTotal}</div>
      </div>
    </>
  );
};
