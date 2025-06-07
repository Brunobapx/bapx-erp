
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VendorModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  vendorData: any | null;
}

export const VendorModal = ({ isOpen, onClose, vendorData }: VendorModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contact_person: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const isNewVendor = !vendorData?.id;
  
  useEffect(() => {
    if (vendorData) {
      setFormData({
        name: vendorData.name || '',
        cnpj: vendorData.cnpj || '',
        email: vendorData.email || '',
        phone: vendorData.phone || '',
        address: vendorData.address || '',
        city: vendorData.city || '',
        state: vendorData.state || '',
        zip: vendorData.zip || '',
        contact_person: vendorData.contact_person || '',
        notes: vendorData.notes || ''
      });
    } else {
      resetForm();
    }
  }, [vendorData, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      contact_person: '',
      notes: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      if (isNewVendor) {
        // Criar novo fornecedor
        const { error } = await supabase
          .from('vendors')
          .insert({
            user_id: user.id,
            ...formData
          });

        if (error) throw error;
        
        toast.success('Fornecedor cadastrado com sucesso!');
      } else {
        // Atualizar fornecedor existente
        const { error } = await supabase
          .from('vendors')
          .update(formData)
          .eq('id', vendorData.id);

        if (error) throw error;
        
        toast.success('Fornecedor atualizado com sucesso!');
      }
      
      onClose(true); // true indica que deve fazer refresh
      resetForm();
      
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNewVendor ? 'Novo Fornecedor' : 'Editar Fornecedor'}</DialogTitle>
        </DialogHeader>
        
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-erp-production hover:bg-erp-production/90"
            >
              {loading ? 'Salvando...' : (isNewVendor ? 'Cadastrar' : 'Salvar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
