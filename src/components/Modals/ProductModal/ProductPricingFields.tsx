import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProductPricingFieldsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProductPricingFields: React.FC<ProductPricingFieldsProps> = ({
  formData,
  handleChange
}) => {
  const calculateMargin = () => {
    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.cost) || 0;
    if (price > 0 && cost > 0) {
      return (((price - cost) / price) * 100).toFixed(2);
    }
    return "0.00";
  };

  const calculateMarkup = () => {
    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.cost) || 0;
    if (cost > 0) {
      return (((price - cost) / cost) * 100).toFixed(2);
    }
    return "0.00";
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-4">Informações Comerciais</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Preço de Venda (R$)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              placeholder="0,00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cost">Custo do Produto (R$)</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={handleChange}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Margem e Markup calculados */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Margem de Lucro (%)</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {calculateMargin()}%
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Markup (%)</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {calculateMarkup()}%
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-4">Controle de Estoque</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="stock">Estoque Atual</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              step="0.01"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">Peso por Unidade (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.001"
              value={formData.weight}
              onChange={handleChange}
              placeholder="0,000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};