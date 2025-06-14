
import React, { useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { useVendorForm } from "./useVendorForm";
import { useCepLookup } from "@/hooks/useCepLookup";
import { toast } from "@/components/ui/sonner";

interface VendorModalFormProps {
  vendorData: any | null;
  onClose: (refresh?: boolean) => void;
}

const VendorModalForm: React.FC<VendorModalFormProps> = ({ vendorData, onClose }) => {
  const {
    formData,
    isSubmitting,
    isNewVendor,
    handleChange,
    handleSubmit,
    resetForm,
    setFormData
  } = useVendorForm(vendorData, onClose) as any;

  const { lookupCep, loading: loadingCep } = useCepLookup();
  const cepButtonRef = useRef<HTMLButtonElement>(null);

  const handleCancel = () => {
    onClose();
    resetForm();
  };

  // Busca CEP e preenche campos de endereço
  const handleCepSearch = async () => {
    if (!formData.zip) {
      toast.error("Digite um CEP para buscar o endereço.");
      return;
    }
    const address = await lookupCep(formData.zip);
    if (address) {
      setFormData((prev: any) => ({
        ...prev,
        address: address.logradouro || '',
        city: address.localidade || '',
        state: address.uf || '',
        // Não temos column bairro na tabela vendors, portanto não preenchemos
      }));
      toast.success("Endereço atualizado a partir do CEP!");
    }
  };

  // Faz busca automática ao perder foco do campo zip (se o valor mudou)
  const handleZipBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formData.zip?.replace(/\D/g, "");
    if (formatted && formatted.length === 8) {
      handleCepSearch();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Razão Social *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          name="cnpj"
          value={formData.cnpj}
          onChange={handleChange}
          placeholder="00.000.000/0000-00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contact_person">Nome do Contato</Label>
        <Input
          id="contact_person"
          name="contact_person"
          value={formData.contact_person}
          onChange={handleChange}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="zip">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              onBlur={handleZipBlur}
              maxLength={9}
              placeholder="00000-000"
            />
            <Button
              type="button"
              ref={cepButtonRef}
              onClick={handleCepSearch}
              disabled={loadingCep}
              className="bg-muted border"
              tabIndex={0}
            >
              {loadingCep ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-erp-production hover:bg-erp-production/90"
        >
          {isSubmitting ? 'Salvando...' : (isNewVendor ? 'Cadastrar' : 'Salvar')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default VendorModalForm;

