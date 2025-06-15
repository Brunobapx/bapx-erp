
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductFiscalFieldsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  taxTypeOptions: Array<{ value: string, label: string }>;
}

export const ProductFiscalFields: React.FC<ProductFiscalFieldsProps> = ({
  formData, handleChange, handleSelectChange, taxTypeOptions
}) => (
  <div className="border-t pt-4 mt-2">
    <h4 className="text-sm font-medium mb-2">Informações Fiscais</h4>
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="ncm">NCM</Label>
        <Input
          id="ncm"
          name="ncm"
          value={formData.ncm}
          onChange={handleChange}
          placeholder="0000.00.00"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tax_type">Tipo Tributário</Label>
        <Select
          value={formData.tax_type}
          onValueChange={value => handleSelectChange('tax_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            {taxTypeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-4 mt-4">
      <div className="grid gap-2">
        <Label htmlFor="icms">ICMS (%)</Label>
        <Input
          id="icms"
          name="icms"
          value={formData.icms}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ipi">IPI (%)</Label>
        <Input
          id="ipi"
          name="ipi"
          value={formData.ipi}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="pis">PIS (%)</Label>
        <Input
          id="pis"
          name="pis"
          value={formData.pis}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cofins">COFINS (%)</Label>
        <Input
          id="cofins"
          name="cofins"
          value={formData.cofins}
          onChange={handleChange}
        />
      </div>
    </div>
  </div>
);
