import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface ProductFiscalFieldsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  taxTypeOptions: Array<{
    value: string;
    label: string;
  }>;
  fiscalSettings?: any;
}
export const ProductFiscalFields: React.FC<ProductFiscalFieldsProps> = ({
  formData,
  handleChange,
  handleSelectChange,
  taxTypeOptions,
  fiscalSettings
}) => <div className="border-t pt-4 mt-2">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-medium">Informações Fiscais</h4>
      {fiscalSettings}
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="ncm">NCM (obrigatório)</Label>
        <Input id="ncm" name="ncm" value={formData.ncm} onChange={handleChange} placeholder="0000.00.00" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cest">CEST (quando exigido)</Label>
        <Input id="cest" name="cest" value={formData.cest} onChange={handleChange} placeholder="1706200" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cst_csosn">CST/CSOSN padrão</Label>
        <Select value={formData.cst_csosn} onValueChange={value => handleSelectChange('cst_csosn', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="101">101 - Tributada pelo Simples Nacional</SelectItem>
            <SelectItem value="102">102 - Tributada pelo Simples Nacional sem permissão de crédito</SelectItem>
            <SelectItem value="103">103 - Isenção do ICMS no Simples Nacional</SelectItem>
            <SelectItem value="201">201 - Tributada pelo Simples Nacional com permissão de crédito</SelectItem>
            <SelectItem value="202">202 - Tributada pelo Simples Nacional sem permissão de crédito</SelectItem>
            <SelectItem value="203">203 - Isenção do ICMS no Simples Nacional</SelectItem>
            <SelectItem value="60">60 - ICMS cobrado por substituição tributária</SelectItem>
            <SelectItem value="00">00 - Tributada integralmente</SelectItem>
            <SelectItem value="20">20 - Com redução de base de cálculo</SelectItem>
            <SelectItem value="40">40 - Isenta</SelectItem>
            <SelectItem value="41">41 - Não tributada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid gap-2 mt-4">
      <div className="grid gap-2">
        <Label htmlFor="tax_type">Tipo Tributário</Label>
        <Select value={formData.tax_type} onValueChange={value => handleSelectChange('tax_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            {taxTypeOptions.map(option => <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-4 mt-4">
      <div className="grid gap-2">
        <Label htmlFor="icms">ICMS (%) - Alíquota sugerida</Label>
        <Input id="icms" name="icms" value={formData.icms} onChange={handleChange} placeholder="18" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ipi">IPI (%)</Label>
        <Input id="ipi" name="ipi" value={formData.ipi} onChange={handleChange} placeholder="5" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="pis">PIS (%) - Alíquota sugerida</Label>
        <Input id="pis" name="pis" value={formData.pis} onChange={handleChange} placeholder="1.65" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cofins">COFINS (%) - Alíquota sugerida</Label>
        <Input id="cofins" name="cofins" value={formData.cofins} onChange={handleChange} placeholder="7.6" />
      </div>
    </div>
  </div>;