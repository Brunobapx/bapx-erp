
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorData: any | null;
}

export const VendorModal = ({ isOpen, onClose, vendorData }: VendorModalProps) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    cnpj: '',
    ie: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    type: 'Distribuidor',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const isNewVendor = !vendorData?.id;
  
  useEffect(() => {
    if (vendorData) {
      setFormData({
        id: vendorData.id || '',
        name: vendorData.name || '',
        cnpj: vendorData.cnpj || '',
        ie: vendorData.ie || '',
        email: vendorData.email || '',
        phone: vendorData.phone || '',
        address: vendorData.address || '',
        city: vendorData.city || '',
        state: vendorData.state || '',
        zip: vendorData.zip || '',
        type: vendorData.type || 'Distribuidor',
        contactName: vendorData.contactName || '',
        contactEmail: vendorData.contactEmail || '',
        contactPhone: vendorData.contactPhone || ''
      });
    } else {
      resetForm();
    }
  }, [vendorData]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      cnpj: '',
      ie: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      type: 'Distribuidor',
      contactName: '',
      contactEmail: '',
      contactPhone: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Here we would submit to backend API
    // For now just show a toast notification
    toast({
      title: isNewVendor ? "Fornecedor adicionado" : "Fornecedor atualizado",
      description: `${formData.name} foi ${isNewVendor ? 'adicionado' : 'atualizado'} com sucesso.`,
    });
    onClose();
  };

  const vendorTypes = [
    { value: 'Distribuidor', label: 'Distribuidor' },
    { value: 'Fabricante', label: 'Fabricante' },
    { value: 'Importador', label: 'Importador' },
    { value: 'Atacadista', label: 'Atacadista' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNewVendor ? 'Novo Fornecedor' : 'Editar Fornecedor'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Razão Social</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="grid gap-2">
              <Label htmlFor="ie">Inscrição Estadual</Label>
              <Input
                id="ie"
                name="ie"
                value={formData.ie}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Fornecedor</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {vendorTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Contact Information */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-2">Informações de Contato</h4>
            
            <div className="grid gap-2">
              <Label htmlFor="contactName">Nome do Contato</Label>
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Email do Contato</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Telefone do Contato</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            className="bg-erp-production hover:bg-erp-production/90"
          >
            {isNewVendor ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
