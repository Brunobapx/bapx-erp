
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { useVendorForm } from "./useVendorForm";

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
    resetForm
  } = useVendorForm(vendorData, onClose);

  const handleCancel = () => {
    onClose();
    resetForm();
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
          <Input
            id="zip"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
          />
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
