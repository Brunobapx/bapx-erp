
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AddressFieldsProps {
  formData: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AddressFields = ({ formData, onChange }: AddressFieldsProps) => {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={onChange}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={onChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={onChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="zip">CEP</Label>
          <Input
            id="zip"
            name="zip"
            value={formData.zip}
            onChange={onChange}
          />
        </div>
      </div>
    </>
  );
};
