
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PersonTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const PersonTypeSelector = ({ value, onChange }: PersonTypeSelectorProps) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="type">Tipo de Pessoa</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Jurídica" id="juridica" />
          <Label htmlFor="juridica">Jurídica (CNPJ)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Física" id="fisica" />
          <Label htmlFor="fisica">Física (CPF)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
