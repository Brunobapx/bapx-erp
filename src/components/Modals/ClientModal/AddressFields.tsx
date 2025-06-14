
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCepLookup } from "@/hooks/useCepLookup";
import { Loader2 } from "lucide-react";

interface AddressFieldsProps {
  formData: {
    address: string;
    city: string;
    state: string;
    zip: string;
    bairro?: string; // viaCEP
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoAddressChange?: (fields: Partial<AddressFieldsProps["formData"]>) => void;
}

export const AddressFields = ({
  formData,
  onChange,
  onAutoAddressChange
}: AddressFieldsProps) => {
  const { lookupCep, loading } = useCepLookup();
  const [lastCep, setLastCep] = useState(""); // controla pra não repetir requisição

  // Função para buscar e atualizar os campos ao digitar CEP
  const handleCepBlur = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value.replace(/\D/g, "");
    if (rawCep.length === 8 && rawCep !== lastCep) {
      setLastCep(rawCep);
      const result = await lookupCep(rawCep);
      if (result) {
        onAutoAddressChange &&
          onAutoAddressChange({
            address: result.logradouro || "",
            city: result.localidade || "",
            state: result.uf || "",
            bairro: result.bairro || ""
          });
      } else {
        // Limpa campos se não achou (opcional)
        onAutoAddressChange &&
          onAutoAddressChange({
            address: "",
            city: "",
            state: "",
            bairro: ""
          });
      }
    }
  };

  // Máscara para CEP: 00000-000
  const formatCep = (cep: string) =>
    cep.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").substring(0, 9);

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={onChange}
          placeholder="Rua, Av..."
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="grid gap-2 col-span-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={onChange}
            placeholder="Cidade"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">UF</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={onChange}
            maxLength={2}
            placeholder="UF"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="zip">CEP</Label>
          <div className="relative">
            <Input
              id="zip"
              name="zip"
              value={formatCep(formData.zip)}
              onChange={onChange}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              maxLength={9}
              autoComplete="postal-code"
              inputMode="numeric"
            />
            {loading && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
      {formData.bairro !== undefined && (
        <div className="grid gap-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            name="bairro"
            value={formData.bairro}
            onChange={onChange}
            placeholder="Bairro"
          />
        </div>
      )}
    </>
  );
};
