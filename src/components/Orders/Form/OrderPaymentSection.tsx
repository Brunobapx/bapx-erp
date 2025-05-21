
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderPaymentSectionProps {
  paymentMethod: string;
  paymentTerm: string;
  seller: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const OrderPaymentSection: React.FC<OrderPaymentSectionProps> = ({
  paymentMethod,
  paymentTerm,
  seller,
  onChange,
  onSelectChange
}) => {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="payment_method">Forma de Pagamento</Label>
        <Select 
          name="payment_method"
          value={paymentMethod}
          onValueChange={(value) => onSelectChange('payment_method', value)}
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
          value={paymentTerm}
          onValueChange={(value) => onSelectChange('payment_term', value)}
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
          value={seller || ''}
          onChange={onChange}
          placeholder="Nome do vendedor"
        />
      </div>
    </>
  );
};
