
import React from 'react';
import { Label } from "@/components/ui/label";
import { ClientSelector } from '../ClientSelector';
import { Client } from '@/hooks/useClients';

interface OrderClientSectionProps {
  selectedClientId: string;
  selectedClientName: string;
  onClientSelect: (clientId: string, clientName: string) => void;
  clients: Client[];
  openClientCombobox: boolean;
  setOpenClientCombobox: (open: boolean) => void;
}

export const OrderClientSection: React.FC<OrderClientSectionProps> = ({
  selectedClientId,
  selectedClientName,
  onClientSelect,
  clients,
  openClientCombobox,
  setOpenClientCombobox
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="client">Cliente *</Label>
      <ClientSelector 
        clients={clients}
        selectedClientId={selectedClientId}
        selectedClientName={selectedClientName}
        onClientSelect={onClientSelect}
        open={openClientCombobox}
        setOpen={setOpenClientCombobox}
      />
    </div>
  );
};
