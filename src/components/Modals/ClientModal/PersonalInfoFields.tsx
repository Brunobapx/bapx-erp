
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PersonalInfoFieldsProps {
  type: string;
  formData: {
    cnpj: string;
    ie: string;
    cpf: string;
    rg: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoFields = ({ type, formData, onChange }: PersonalInfoFieldsProps) => {
  if (type === 'Jurídica') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            name="cnpj"
            value={formData.cnpj}
            onChange={onChange}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ie">Inscrição Estadual</Label>
          <Input
            id="ie"
            name="ie"
            value={formData.ie}
            onChange={onChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          name="cpf"
          value={formData.cpf}
          onChange={onChange}
          placeholder="000.000.000-00"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rg">RG</Label>
        <Input
          id="rg"
          name="rg"
          value={formData.rg}
          onChange={onChange}
        />
      </div>
    </div>
  );
};
