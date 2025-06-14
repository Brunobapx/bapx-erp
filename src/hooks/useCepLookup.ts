
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/sonner";

type AddressResult = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
};

export function useCepLookup() {
  const [loading, setLoading] = useState(false);

  // Busca CEP no ViaCEP
  const lookupCep = useCallback(async (cep: string): Promise<AddressResult | null> => {
    // Tira caracteres não-numéricos
    const formattedCep = cep.replace(/\D/g, "");
    if (formattedCep.length !== 8) {
      toast.error("CEP inválido. Deve conter 8 dígitos.");
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${formattedCep}/json/`);
      if (!response.ok) throw new Error("Erro na consulta do CEP");
      const data = await response.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return null;
      }
      return data as AddressResult;
    } catch (err: any) {
      toast.error("Erro ao buscar o CEP. Tente novamente.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupCep, loading };
}
