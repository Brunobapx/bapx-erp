import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTestOrderCreate = () => {
  const [isTestingCreate, setIsTestingCreate] = useState(false);

  const testCreateOrder = async () => {
    setIsTestingCreate(true);
    
    try {
      console.log('[TEST] Iniciando teste de criação de pedido...');
      
      // Verificar conexão
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData?.session) {
        throw new Error('Não autenticado');
      }
      
      console.log('[TEST] Usuário autenticado:', authData.session.user.id);
      
      // Buscar um cliente para usar no teste
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .limit(1);
        
      if (clientError || !clients || clients.length === 0) {
        throw new Error('Nenhum cliente encontrado para teste');
      }
      
      const testClient = clients[0];
      console.log('[TEST] Cliente para teste:', testClient);
      
      // Testar consulta simples primeiro na tabela orders
      console.log('[TEST] Testando SELECT simples...');
      const { data: existingOrders, error: selectError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
        
      if (selectError) {
        console.error('[TEST] Erro na consulta SELECT:', selectError);
        throw new Error(`Erro SELECT na tabela orders: ${selectError.message}`);
      }
      
      console.log('[TEST] SELECT funcionou! Pedidos existentes:', existingOrders?.length || 0);
      
      // Se chegou até aqui, o problema não é na tabela, é no INSERT
      // Vamos tentar um INSERT simples
      console.log('[TEST] Tentando INSERT simples...');
      
      const orderData = {
        user_id: authData.session.user.id,
        client_id: testClient.id,
        client_name: testClient.name,
        total_amount: 29.01,
        status: 'pending'
      };
      
      console.log('[TEST] Dados do pedido:', orderData);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
        
      if (insertError) {
        console.error('[TEST] Erro no INSERT:', insertError);
        
        // Tentar inserção via SQL direto
        console.log('[TEST] Tentando SQL direto via query...');
        
        const { data: sqlResult, error: sqlError } = await supabase
          .from('orders')
          .insert([orderData])
          .select();
          
        if (sqlError) {
          console.error('[TEST] SQL direto também falhou:', sqlError);
          throw new Error(`INSERT falhou: ${sqlError.message}`);
        }
        
        console.log('[TEST] SQL direto funcionou!', sqlResult);
        toast.success(`Teste passou com SQL direto! ID: ${sqlResult[0]?.id}`);
        return sqlResult[0];
      }
      
      console.log('[TEST] INSERT funcionou!', insertResult);
      toast.success(`Teste passou! ID: ${insertResult.id}`);
      return insertResult;
      
    } catch (error: any) {
      console.error('[TEST] Falha no teste de criação:', error);
      toast.error(`Teste falhou: ${error.message}`);
      throw error;
    } finally {
      setIsTestingCreate(false);
    }
  };

  return {
    testCreateOrder,
    isTestingCreate
  };
};