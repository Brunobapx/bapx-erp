
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ProductBasicFieldsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleSwitchChange: (name: string, checked: boolean) => void;
  unitOptions: Array<{ value: string, label: string }>;
  categories: any[];
}

export const ProductBasicFields: React.FC<ProductBasicFieldsProps> = ({
  formData, handleChange, handleSelectChange, handleSwitchChange, unitOptions, categories
}) => {
  const getProductType = () => {
    if (formData.is_manufactured) return "Produto Fabricado";
    if (formData.is_direct_sale) return "Venda Direta";
    return "Produto Normal";
  };

  return (
    <div className="space-y-6">
      {/* Informações de Identificação */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">Informações de Identificação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-3 grid gap-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite o nome do produto"
              required
            />
          </div>
          <div className="flex items-center justify-start md:justify-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
            />
            <Label htmlFor="is_active" className="text-sm font-medium">
              {formData.is_active ? 'Ativo' : 'Inativo'}
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Código Interno</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ex: PROD001"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sku">Código de Barras (SKU/EAN)</Label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Ex: 7891234567890"
            />
          </div>
          <div className="grid gap-2">
            <Label>Tipo de Produto</Label>
            <div className="flex items-center h-10 px-3 py-2 border border-input bg-background rounded-md">
              <Badge variant={formData.is_manufactured ? "default" : formData.is_direct_sale ? "secondary" : "outline"}>
                {getProductType()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Classificação */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">Classificação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unit">Unidade de Medida *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => handleSelectChange('unit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar unidade..." />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Especificações Físicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">Especificações Físicas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="weight">Peso Líquido (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.001"
              value={formData.weight}
              onChange={handleChange}
              placeholder="0.000"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gross_weight">Peso Bruto (kg)</Label>
            <Input
              id="gross_weight"
              name="gross_weight"
              type="number"
              step="0.001"
              value={formData.gross_weight || ''}
              onChange={handleChange}
              placeholder="0.000"
            />
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">Descrição</h3>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Observações</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descrição detalhada do produto, características, instruções de uso, etc."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
