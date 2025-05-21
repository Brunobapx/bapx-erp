
import React from 'react';
import { Label } from "@/components/ui/label";
import { DateSelector } from '../DateSelector';

interface OrderDeliverySectionProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  openCalendar: boolean;
  setOpenCalendar: (open: boolean) => void;
}

export const OrderDeliverySection: React.FC<OrderDeliverySectionProps> = ({
  selectedDate,
  onDateSelect,
  openCalendar,
  setOpenCalendar
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="delivery_deadline">Data de Entrega</Label>
      <DateSelector 
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        open={openCalendar}
        setOpen={setOpenCalendar}
      />
    </div>
  );
};
