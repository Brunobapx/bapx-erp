
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PersonTypeSelector } from './PersonTypeSelector';
import { PersonalInfoFields } from './PersonalInfoFields';
import { ContactInfoFields } from './ContactInfoFields';
import { AddressFields } from './AddressFields';

interface ClientModalFormProps {
  formData: {
    name: string;
    type: string;
    cnpj: string;
    ie: string;
    cpf: string;
    rg: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTypeChange: (value: string) => void;
}

export const ClientModalForm = ({ formData, onChange, onTypeChange }: ClientModalFormProps) => {
  return (
    <div className="grid gap-4 py-4">
      <PersonTypeSelector
        value={formData.type}
        onChange={onTypeChange}
      />
      
      <div className="grid gap-2">
        <Label htmlFor="name">Nome / Razão Social</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onChange}
        />
      </div>

      <PersonalInfoFields
        type={formData.type}
        formData={{
          cnpj: formData.cnpj,
          ie: formData.ie,
          cpf: formData.cpf,
          rg: formData.rg
        }}
        onChange={onChange}
      />

      <ContactInfoFields
        formData={{
          email: formData.email,
          phone: formData.phone
        }}
        onChange={onChange}
      />

      <AddressFields
        formData={{
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        }}
        onChange={onChange}
      />
    </div>
  );
};
