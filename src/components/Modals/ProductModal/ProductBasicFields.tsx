
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ProductBasicFieldsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleSwitchChange: (name: string, checked: boolean) => void;
  unitOptions: Array<{ value: string, label: string }>;
  categories: any[];
}

export const ProductBasicFields: React.FC<ProductBasicFieldsProps> = ({
  formData, handleChange, handleSelectChange, handleSwitchChange, unitOptions, categories
}) => (
  <React.Fragment>
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="code">Código</Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sku">SKU/EAN</Label>
        <Input
          id="sku"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
        />
      </div>
    </div>

    <div className="grid grid-cols-4 gap-4 items-end">
      <div className="grid gap-2 col-span-3">
        <Label htmlFor="name">Nome do Produto</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
        />
        <Label htmlFor="is_active" className="text-sm">
          {formData.is_active ? 'Ativo' : 'Inativo'}
        </Label>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="category">Categoria</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => handleSelectChange('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar..." />
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
        <Label htmlFor="unit">Unidade</Label>
        <Select
          value={formData.unit}
          onValueChange={(value) => handleSelectChange('unit', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar..." />
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

    <div className="grid grid-cols-4 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cost">Custo (R$)</Label>
        <Input
          id="cost"
          name="cost"
          type="number"
          step="0.01"
          value={formData.cost}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stock">Estoque</Label>
        <Input
          id="stock"
          name="stock"
          type="number"
          step="0.01"
          value={formData.stock}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="weight">Peso (kg)</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          step="0.001"
          value={formData.weight}
          onChange={handleChange}
        />
      </div>
    </div>
  </React.Fragment>
);
