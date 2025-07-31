
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

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
      console.log('[handleSubmit] Iniciando criação/atualização de pedido');
      console.log('[handleSubmit] RLS TEMPORARIAMENTE DESABILITADO PARA DEBUGGING');
      
      // Verificação robusta de autenticação com retry
      let session = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !session) {
        attempts++;
        console.log(`[handleSubmit] Tentativa ${attempts}/${maxAttempts} de obter sessão`);
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error(`[handleSubmit] Erro na tentativa ${attempts}:`, sessionError);
          if (attempts === maxAttempts) {
            toast.error("Erro de autenticação após múltiplas tentativas. Recarregue a página.");
            return null;
          }
          continue;
        }
        
        if (sessionData?.session?.user) {
          session = sessionData.session;
          console.log('[handleSubmit] ✅ Sessão obtida com sucesso:', {
            userId: session.user.id,
            email: session.user.email,
            tokenPresent: !!session.access_token,
            expiresAt: session.expires_at,
            role: session.user.user_metadata?.role
          });
        } else {
          console.warn(`[handleSubmit] ⚠️ Sessão vazia na tentativa ${attempts}`);
          if (attempts < maxAttempts) {
            console.log('[handleSubmit] 🔄 Tentando refresh do token...');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('[handleSubmit] ❌ Erro no refresh:', refreshError);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!session?.user) {
        console.error('[handleSubmit] ❌ FALHA CRÍTICA: Não foi possível obter sessão válida');
        toast.error("Não foi possível autenticar. Faça login novamente.");
        return null;
      }
      
      const user = session.user;
      const token = session.access_token;
      
      // Verificação adicional do token
      if (!token) {
        console.error('[handleSubmit] ❌ Token JWT não encontrado na sessão');
        toast.error("Token de autenticação não encontrado. Faça login novamente.");
        return null;
      }
      
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.error('[handleSubmit] ❌ Token JWT expirado');
        toast.error("Sessão expirada. Faça login novamente.");
        return null;
      }
      
      console.log('[handleSubmit] ✅ Autenticação verificada. Testando acesso direto ao banco...');
      
      // Teste direto de acesso ao banco
      try {
        const { data: testData, error: testError } = await supabase
          .from('orders')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('[handleSubmit] ❌ Erro no teste de acesso:', testError);
          console.error('[handleSubmit] Código do erro:', testError.code);
          console.error('[handleSubmit] Detalhes:', testError.details);
          console.error('[handleSubmit] Hint:', testError.hint);
          toast.error(`Erro de acesso ao banco: ${testError.message}`);
          return null;
        } else {
          console.log('[handleSubmit] ✅ Teste de acesso bem-sucedido!');
        }
      } catch (error) {
        console.error('[handleSubmit] ❌ Erro no teste de acesso (catch):', error);
        toast.error("Erro inesperado no teste de acesso ao banco");
        return null;
      }

      if (isNewOrder) {
        // Criar novo pedido
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
        
        console.log('[handleSubmit] Dados do pedido a ser criado:', orderData);
        
        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
          
        if (orderError) {
          console.error('[handleSubmit] Erro ao criar pedido:', orderError);
          throw orderError;
        }
        
        console.log('[handleSubmit] Pedido criado com sucesso:', insertedOrder.id);
        
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
        
        console.log('[handleSubmit] Dados dos itens a serem criados:', itemsData.length, 'itens');
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsData);
          
        if (itemsError) {
          console.error('[handleSubmit] Erro ao criar itens do pedido:', itemsError);
          throw itemsError;
        }
        
        console.log('[handleSubmit] Itens do pedido criados com sucesso');
        
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
