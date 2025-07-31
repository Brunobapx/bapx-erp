
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OrderFormState, OrderFormItem } from './useOrderFormState';
import { useNavigate } from 'react-router-dom';
import { checkStockAndSendToProduction } from './stockProcessor';

interface UseOrderFormActionsProps {
  formData: OrderFormState;
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>;
  updateFormattedTotal: (total?: number) => void;
  isNewOrder: boolean;
  onClose: (refresh?: boolean) => void;
  items: OrderFormItem[];
}

export const useOrderFormActions = ({
  formData,
  setFormData,
  updateFormattedTotal,
  isNewOrder,
  onClose,
  items
}: UseOrderFormActionsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId, client_name: clientName }));
  };

  const handleDateSelect = (date: Date | null) => {
    setFormData(prev => ({ ...prev, delivery_deadline: date }));
  };

  const validateForm = () => {
    if (!formData.client_id.trim()) {
      toast.error("Cliente é obrigatório");
      return false;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return false;
    }

    for (const item of items) {
      if (!item.product_id.trim()) {
        toast.error("Todos os itens devem ter um produto selecionado");
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error("Todos os itens devem ter quantidade maior que zero");
        return false;
      }
    }

    return true;
  };

  const checkDirectSaleProducts = async (orderItems: OrderFormItem[]) => {
    try {
      const productIds = orderItems.map(item => item.product_id);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, is_direct_sale')
        .in('id', productIds);

      if (error) {
        console.error('Erro ao verificar produtos de venda direta:', error);
        return false;
      }

      return products?.some(product => product.is_direct_sale) || false;
    } catch (error) {
      console.error('Erro ao verificar produtos de venda direta:', error);
      return false;
    }
  };

  const createSaleFromOrder = async (orderId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user) {
        throw new Error('Usuário não autenticado');
      }
      
      const user = session.user;

      // Criar a venda baseada no pedido
      const saleData = {
        user_id: user.id,
        order_id: orderId,
        client_id: formData.client_id,
        client_name: formData.client_name,
        total_amount: formData.total_amount,
        status: 'pending'
      };

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Atualizar status do pedido para "released_for_sale"
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'released_for_sale' })
        .eq('id', orderId);

      if (orderUpdateError) throw orderUpdateError;

      toast.success("Pedido criado e enviado para vendas automaticamente");
      
      // Navegar para a página de vendas
      setTimeout(() => {
        navigate('/vendas');
      }, 1500);

      return sale.id;
    } catch (error: any) {
      console.error('Erro ao criar venda automática:', error);
      toast.error('Erro ao processar venda automática: ' + error.message);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return null;

    try {
      setIsSubmitting(true);
      
      // Usar a mesma abordagem do useOrderInsert que está funcionando
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Usuário não autenticado. Faça login novamente para continuar.");
        return null;
      }

      if (isNewOrder) {
        // Criar novo pedido usando a mesma estrutura do useOrderInsert
        const orderData = {
          user_id: user.id,
          client_id: formData.client_id,
          client_name: formData.client_name,
          seller: formData.seller || null,
          total_amount: formData.total_amount,
          delivery_deadline: formData.delivery_deadline?.toISOString().split('T')[0] || null,
          payment_method: formData.payment_method || null,
          payment_term: formData.payment_term || null,
          notes: formData.notes || null,
          status: 'pending'
        };
        
        console.log('Tentando inserir pedido:', orderData);
        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
          
        console.log('Resultado da inserção:', { insertedOrder, orderError });
          
        if (orderError) {
          console.error('Erro ao criar pedido:', orderError);
          throw orderError;
        }
        
        // Criar todos os itens do pedido
        const itemsData = items.map(item => ({
          user_id: user.id,
          order_id: insertedOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsData);
          
        if (itemsError) throw itemsError;
        
        // Verificar estoque e processar para produção/embalagem
        console.log('Iniciando verificação de estoque e processamento...');
        const stockProcessed = await checkStockAndSendToProduction(insertedOrder.id);
        
        if (!stockProcessed) {
          toast.error("Erro ao processar estoque. Verifique o pedido criado.");
        }
        
        // Verificar se algum produto é de venda direta
        const hasDirectSaleProducts = await checkDirectSaleProducts(items);
        
        if (hasDirectSaleProducts) {
          console.log('Produto de venda direta detectado, criando venda automaticamente...');
          await createSaleFromOrder(insertedOrder.id);
        } else if (stockProcessed) {
          // Não mostra toast aqui pois checkStockAndSendToProduction já mostra as mensagens
          console.log("Pedido criado e processado com sucesso");
        } else {
          toast.success("Pedido criado com sucesso");
        }
        
        // Fechar modal e atualizar lista
        onClose(true);
        
        return insertedOrder.id;
      } else {
        // Atualizar pedido existente
        const orderUpdateData = {
          client_id: formData.client_id,
          client_name: formData.client_name,
          seller: formData.seller || null,
          total_amount: formData.total_amount,
          delivery_deadline: formData.delivery_deadline?.toISOString().split('T')[0] || null,
          payment_method: formData.payment_method || null,
          payment_term: formData.payment_term || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        };
        
        const { error: orderError } = await supabase
          .from('orders')
          .update(orderUpdateData)
          .eq('id', formData.id);
          
        if (orderError) throw orderError;
        
        // Deletar itens existentes e recriar
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', formData.id);
          
        if (deleteError) throw deleteError;
        
        // Recriar todos os itens
        const itemsData = items.map(item => ({
          user_id: user.id,
          order_id: formData.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsData);
          
        if (itemsError) throw itemsError;
        
        toast.success("Pedido atualizado com sucesso");
        return formData.id;
      }
    } catch (error: any) {
      console.error("Erro ao salvar pedido:", error);
      toast.error(`Erro ao ${isNewOrder ? 'criar' : 'atualizar'} pedido: ${error.message}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleChange,
    handleClientSelect,
    handleDateSelect,
    handleSubmit,
    validateForm
  };
};
