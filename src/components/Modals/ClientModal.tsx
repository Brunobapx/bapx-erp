
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';

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

  const handleSubmit = async () => {
    try {
      const userData = {
        name: formData.name,
        type: formData.type,
        cnpj: formData.type === 'Jurídica' ? formData.cnpj : null,
        ie: formData.type === 'Jurídica' ? formData.ie : null,
        cpf: formData.type === 'Física' ? formData.cpf : null,
        rg: formData.type === 'Física' ? formData.rg : null,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      };
      
      if (isNewClient) {
        const { data, error } = await supabase
          .from('clients')
          .insert([userData])
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Cliente adicionado",
          description: `${formData.name} foi adicionado com sucesso.`,
        });
      } else {
        const { data, error } = await supabase
          .from('clients')
          .update(userData)
          .eq('id', formData.id)
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Cliente atualizado",
          description: `${formData.name} foi atualizado com sucesso.`,
        });
      }
      
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar cliente: ${error.message}`,
        variant: "destructive"
      });
    }
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
