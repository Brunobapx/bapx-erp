
import React, { useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useUserPositions } from "@/hooks/useUserPositions";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { usePaymentTerms } from "@/hooks/usePaymentTerms";

interface OrderPaymentSectionProps {
  formData: any;
  onUpdateFormData: (updates: any) => void;
  totalAmount: number;
}

export const OrderPaymentSection: React.FC<OrderPaymentSectionProps> = ({
  formData,
  onUpdateFormData,
  totalAmount
}) => {
  const { user } = useAuth();
  const { isVendedor, loading } = useUserPositions();
  const { items: paymentMethods } = usePaymentMethods();
  const { items: paymentTerms } = usePaymentTerms();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateFormData({ [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    onUpdateFormData({ [name]: value });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Auto-preencher vendedor se o usuário tiver cargo de vendedor
  useEffect(() => {
    if (!loading && user && !formData.seller && isVendedor) {
      // Extrair nome e sobrenome do user metadata
      const firstName = user.user_metadata?.first_name || '';
      const lastName = user.user_metadata?.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) {
        onUpdateFormData({ seller: fullName });
      }
    }
  }, [user, loading, isVendedor, formData.seller, onUpdateFormData]);

  return (
    <>
      <div className="grid gap-2">
        <Label>Total do Pedido</Label>
        <div className="text-2xl font-bold text-green-600 p-3 border rounded bg-green-50">
          {formatCurrency(totalAmount)}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="payment_method">Forma de Pagamento</Label>
        <Select 
          name="payment_method"
          value={formData.payment_method}
          onValueChange={(value) => handleSelectChange('payment_method', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.filter(pm => pm.is_active).map((method) => (
              <SelectItem key={method.id} value={method.name}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="payment_term">Prazo de Pagamento</Label>
        <Select 
          name="payment_term"
          value={formData.payment_term}
          onValueChange={(value) => handleSelectChange('payment_term', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o prazo de pagamento" />
          </SelectTrigger>
          <SelectContent>
            {paymentTerms.filter(pt => pt.is_active).map((term) => (
              <SelectItem key={term.id} value={term.name}>
                {term.name} ({term.days} dias)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="seller">Vendedor</Label>
        <Input 
          id="seller"
          name="seller"
          value={formData.seller || ''}
          onChange={handleChange}
          placeholder="Nome do vendedor"
        />
      </div>
    </>
  );
};
