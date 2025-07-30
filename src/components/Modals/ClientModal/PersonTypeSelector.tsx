
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PersonTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const PersonTypeSelector = ({ value, onChange }: PersonTypeSelectorProps) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="type">Tipo de Pessoa</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Selecione o tipo de pessoa" />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-lg z-50">
          <SelectItem value="Jurídica">Jurídica (CNPJ)</SelectItem>
          <SelectItem value="Física">Física (CPF)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
