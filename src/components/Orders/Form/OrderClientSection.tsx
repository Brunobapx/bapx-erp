
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { ClientSelector } from '../ClientSelector';
import { useClients } from '@/hooks/useClients';

interface OrderClientSectionProps {
  formData: any;
  onUpdateFormData: (updates: any) => void;
  openClientCombobox: boolean;
  setOpenClientCombobox: (open: boolean) => void;
}

export const OrderClientSection: React.FC<OrderClientSectionProps> = ({
  formData,
  onUpdateFormData,
  openClientCombobox,
  setOpenClientCombobox
}) => {
  const { clients, loading, error } = useClients();

  const handleClientSelect = (clientId: string, clientName: string) => {
    onUpdateFormData({ client_id: clientId, client_name: clientName });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAddClient = () => {
    window.open('/clientes', '_blank');
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="client">Cliente *</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            title="Atualizar lista de clientes"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddClient}
            title="Adicionar novo cliente"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Erro ao carregar clientes: {error}
        </div>
      )}
      
      {loading && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          Carregando clientes...
        </div>
      )}
      
      <ClientSelector 
        clients={clients}
        selectedClientId={formData.client_id}
        selectedClientName={formData.client_name}
        onClientSelect={handleClientSelect}
        open={openClientCombobox}
        setOpen={setOpenClientCombobox}
      />
      
      {!loading && !error && clients.length === 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Nenhum cliente cadastrado. <Button variant="link" className="p-0 h-auto text-amber-600" onClick={handleAddClient}>Clique aqui para cadastrar o primeiro cliente.</Button>
        </div>
      )}
    </div>
  );
};
