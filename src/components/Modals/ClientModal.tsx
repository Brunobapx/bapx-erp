
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: any | null;
}

export const ClientModal = ({ isOpen, onClose, clientData }: ClientModalProps) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Jurídica',
    cnpj: '',
    ie: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const isNewClient = !clientData?.id;
  
  useEffect(() => {
    if (clientData) {
      setFormData({
        id: clientData.id || '',
        name: clientData.name || '',
        type: clientData.type || 'Jurídica',
        cnpj: clientData.cnpj || '',
        ie: clientData.ie || '',
        cpf: clientData.cpf || '',
        rg: clientData.rg || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        city: clientData.city || '',
        state: clientData.state || '',
        zip: clientData.zip || ''
      });
    } else {
      resetForm();
    }
  }, [clientData]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      type: 'Jurídica',
      cnpj: '',
      ie: '',
      cpf: '',
      rg: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleSubmit = () => {
    // Here we would submit to backend API
    // For now just show a toast notification
    toast({
      title: isNewClient ? "Cliente adicionado" : "Cliente atualizado",
      description: `${formData.name} foi ${isNewClient ? 'adicionado' : 'atualizado'} com sucesso.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNewClient ? 'Novo Cliente' : 'Editar Cliente'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Pessoa</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={handleTypeChange}
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
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nome / Razão Social</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {formData.type === 'Jurídica' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    name="rg"
                    value={formData.rg}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            className="bg-erp-order hover:bg-erp-order/90"
          >
            {isNewClient ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
