
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateSelector } from '../DateSelector';
import { useOrderFormUI } from '@/hooks/orders/useOrderFormUI';

interface OrderDeliverySectionProps {
  formData: any;
  onUpdateFormData: (updates: any) => void;
}

export const OrderDeliverySection: React.FC<OrderDeliverySectionProps> = ({
  formData,
  onUpdateFormData
}) => {
  const { openCalendar, setOpenCalendar } = useOrderFormUI();

  const handleDateSelect = (date: Date | null) => {
    onUpdateFormData({ delivery_deadline: date });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdateFormData({ [name]: value });
  };

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="delivery_deadline">Data de Entrega</Label>
        <DateSelector 
          selectedDate={formData.delivery_deadline}
          onDateSelect={handleDateSelect}
          open={openCalendar}
          setOpen={setOpenCalendar}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea 
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Observações sobre o pedido"
          rows={3}
        />
      </div>
    </>
  );
};
