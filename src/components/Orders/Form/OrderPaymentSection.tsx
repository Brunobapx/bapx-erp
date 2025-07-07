
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
import { useUserDepartments } from "@/hooks/useUserDepartments";

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
  const { hasAccess, loading: departmentsLoading } = useUserDepartments();

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

  // Auto-preencher vendedor se o usuário for do departamento de vendas
  useEffect(() => {
    if (!departmentsLoading && user && !formData.seller) {
      const isSalesUser = hasAccess('vendas');
      
      if (isSalesUser) {
        // Extrair nome e sobrenome do user metadata
        const firstName = user.user_metadata?.first_name || '';
        const lastName = user.user_metadata?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        if (fullName) {
          onUpdateFormData({ seller: fullName });
        }
      }
    }
  }, [user, departmentsLoading, hasAccess, formData.seller, onUpdateFormData]);

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
            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
            <SelectItem value="PIX">PIX</SelectItem>
            <SelectItem value="Boleto">Boleto</SelectItem>
            <SelectItem value="Transferência">Transferência</SelectItem>
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
            <SelectItem value="À vista">À vista</SelectItem>
            <SelectItem value="7 dias">7 dias</SelectItem>
            <SelectItem value="15 dias">15 dias</SelectItem>
            <SelectItem value="30 dias">30 dias</SelectItem>
            <SelectItem value="45 dias">45 dias</SelectItem>
            <SelectItem value="60 dias">60 dias</SelectItem>
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
