
import React from 'react';
import { Button } from "@/components/ui/button";

interface OrderFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const OrderFormActions: React.FC<OrderFormActionsProps> = ({
  onCancel,
  isSubmitting,
  isEditing
}) => {
  return (
    <div className="flex justify-end gap-4">
      <Button 
        type="button" 
        variant="outline"
        onClick={onCancel}
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Pedido')}
      </Button>
    </div>
  );
};
