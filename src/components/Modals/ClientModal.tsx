
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Client } from '@/hooks/useClients';
import { useClientForm } from './ClientModal/useClientForm';
import { ClientModalForm } from './ClientModal/ClientModalForm';

interface ClientModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  clientData: Client | null;
}

export const ClientModal = ({ isOpen, onClose, clientData }: ClientModalProps) => {
  const {
    formData,
    isSubmitting,
    isNewClient,
    handleChange,
    handleTypeChange,
    handleSubmit
  } = useClientForm(clientData, onClose);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNewClient ? 'Novo Cliente' : 'Editar Cliente'}</DialogTitle>
        </DialogHeader>
        
        <ClientModalForm
          formData={formData}
          onChange={handleChange}
          onTypeChange={handleTypeChange}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            className="bg-erp-order hover:bg-erp-order/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : isNewClient ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
