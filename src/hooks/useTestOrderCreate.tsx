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
      
      // Testar consulta simples primeiro
      const { data: existingOrders, error: selectError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
        
      if (selectError) {
        console.error('[TEST] Erro na consulta SELECT:', selectError);
        throw new Error(`Erro SELECT: ${selectError.message}`);
      }
      
      console.log('[TEST] Consulta SELECT funcionou, pedidos existentes:', existingOrders?.length || 0);
      
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
      
      // Tentar inserir usando SQL RAW
      const { data: rawInsert, error: rawError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO public.orders (user_id, client_id, client_name, total_amount, status) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `,
        params: [
          authData.session.user.id,
          testClient.id,
          testClient.name,
          29.01,
          'pending'
        ]
      });
      
      if (rawError) {
        console.error('[TEST] Erro na inserção RAW:', rawError);
        
        // Tentar inserção normal se SQL RAW falhar
        console.log('[TEST] Tentando inserção normal...');
        
        const orderData = {
          user_id: authData.session.user.id,
          client_id: testClient.id,
          client_name: testClient.name,
          total_amount: 29.01,
          status: 'pending'
        };
        
        console.log('[TEST] Dados do pedido:', orderData);
        
        const { data: normalInsert, error: normalError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
          
        if (normalError) {
          console.error('[TEST] Erro na inserção normal:', normalError);
          throw new Error(`Erro inserção normal: ${normalError.message}`);
        }
        
        console.log('[TEST] Inserção normal funcionou!', normalInsert);
        toast.success(`Teste de criação de pedido passou! ID: ${normalInsert.id}`);
        return normalInsert;
      }
      
      console.log('[TEST] Inserção RAW funcionou!', rawInsert);
      toast.success('Teste de criação de pedido (RAW) passou!');
      return rawInsert;
      
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