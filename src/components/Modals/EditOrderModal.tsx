import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Order } from '@/hooks/useOrders';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DateSelector } from "../Orders/DateSelector";
import { ClientSelector } from "../Orders/ClientSelector";
import { useClients } from '@/hooks/useClients';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePaymentTerms } from '@/hooks/usePaymentTerms';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  orderData: Order | null;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  orderData
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  
  const { clients } = useClients();
  const { items: paymentMethods } = usePaymentMethods();
  const { items: paymentTerms } = usePaymentTerms();

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    delivery_deadline: null as Date | null,
    payment_method: '',
    payment_term: '',
    notes: ''
  });

  useEffect(() => {
    if (orderData) {
      setFormData({
        client_id: orderData.client_id || '',
        client_name: orderData.client_name || '',
        delivery_deadline: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        notes: orderData.notes || ''
      });
    }
  }, [orderData]);

  const handleClientSelect = (clientId: string, clientName: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: clientName
    }));
    setOpenClientCombobox(false);
  };

  const handleDateSelect = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      delivery_deadline: date
    }));
    setOpenCalendar(false);
  };

  const handleSave = async () => {
    if (!orderData?.id) return;

    try {
      setSaving(true);

      // Atualizar dados do pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          client_id: formData.client_id,
          delivery_deadline: formData.delivery_deadline?.toISOString(),
          payment_method: formData.payment_method,
          payment_term: formData.payment_term,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderData.id);

      if (orderError) throw orderError;

      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso!"
      });

      onClose(true);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!orderData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido - {orderData.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <ClientSelector
              clients={clients}
              selectedClientId={formData.client_id}
              selectedClientName={formData.client_name}
              onClientSelect={handleClientSelect}
              open={openClientCombobox}
              setOpen={setOpenClientCombobox}
            />
          </div>

          {/* Data de Entrega */}
          <div className="space-y-2">
            <Label>Data de Entrega</Label>
            <DateSelector
              selectedDate={formData.delivery_deadline}
              onDateSelect={handleDateSelect}
              open={openCalendar}
              setOpen={setOpenCalendar}
            />
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento</Label>
            <select
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.name}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prazo de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="payment_term">Prazo de Pagamento</Label>
            <select
              id="payment_term"
              value={formData.payment_term}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_term: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              {paymentTerms.map((term) => (
                <option key={term.id} value={term.name}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};