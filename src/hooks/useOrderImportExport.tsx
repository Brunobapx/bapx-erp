import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { exportData, importFromFile, createTemplate, type ExportOptions } from '@/utils/importExport';
import { Order, OrderItem } from '@/hooks/useOrders';

interface OrderExportData {
  numero_pedido: string;
  cliente: string;
  vendedor?: string;
  status: string;
  valor_total: number;
  data_entrega?: string;
  forma_pagamento?: string;
  prazo_pagamento?: string;
  observacoes?: string;
  data_criacao: string;
  // Campos dos itens
  produto: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

interface OrderImportData {
  numero_pedido?: string;
  cliente: string;
  vendedor?: string;
  status?: string;
  valor_total?: number;
  data_entrega?: string;
  forma_pagamento?: string;
  prazo_pagamento?: string;
  observacoes?: string;
  // Itens do pedido
  produto: string;
  quantidade: number;
  preco_unitario: number;
  preco_total?: number;
}

export const useOrderImportExport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const orderHeaders = [
    'numero_pedido',
    'cliente', 
    'vendedor',
    'status',
    'valor_total',
    'data_entrega',
    'forma_pagamento',
    'prazo_pagamento',
    'observacoes',
    'data_criacao',
    'produto',
    'quantidade',
    'preco_unitario',
    'preco_total'
  ];

  const generateTemplate = () => {
    const templateData = [{
      numero_pedido: 'PED-001',
      cliente: 'Empresa ABC Ltda',
      vendedor: 'João Silva',
      status: 'pending',
      valor_total: 1500.00,
      data_entrega: '2024-12-31',
      forma_pagamento: 'Cartão',
      prazo_pagamento: '30 dias',
      observacoes: 'Entrega preferencial pela manhã',
      data_criacao: '2024-01-15',
      produto: 'Produto A',
      quantidade: 10,
      preco_unitario: 150.00,
      preco_total: 1500.00
    }];

    return createTemplate(templateData, 'template_pedidos.xlsx');
  };

  const exportOrders = async (orders: Order[], options: ExportOptions) => {
    setIsExporting(true);
    try {
      // Transformar dados para formato de exportação
      const ordersData: OrderExportData[] = [];
      
      orders.forEach(order => {
        if (order.order_items && order.order_items.length > 0) {
          // Para cada item do pedido, criar uma linha
          order.order_items.forEach(item => {
            ordersData.push({
              numero_pedido: order.order_number,
              cliente: order.client_name,
              vendedor: order.seller || '',
              status: order.status,
              valor_total: order.total_amount,
              data_entrega: order.delivery_deadline || '',
              forma_pagamento: order.payment_method || '',
              prazo_pagamento: order.payment_term || '',
              observacoes: order.notes || '',
              data_criacao: new Date(order.created_at).toLocaleDateString('pt-BR'),
              produto: item.product_name,
              quantidade: item.quantity,
              preco_unitario: item.unit_price,
              preco_total: item.total_price
            });
          });
        } else {
          // Se não tem itens, incluir só o pedido
          ordersData.push({
            numero_pedido: order.order_number,
            cliente: order.client_name,
            vendedor: order.seller || '',
            status: order.status,
            valor_total: order.total_amount,
            data_entrega: order.delivery_deadline || '',
            forma_pagamento: order.payment_method || '',
            prazo_pagamento: order.payment_term || '',
            observacoes: order.notes || '',
            data_criacao: new Date(order.created_at).toLocaleDateString('pt-BR'),
            produto: '',
            quantidade: 0,
            preco_unitario: 0,
            preco_total: 0
          });
        }
      });

      exportData({
        ...options,
        data: ordersData
      });
      
      toast({
        title: "Exportação realizada",
        description: `${orders.length} pedidos exportados com sucesso!`,
      });
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os pedidos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importOrders = async (file: File) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const data = await importFromFile<OrderImportData>(file);
      
      if (!data || data.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo não contém dados válidos",
          variant: "destructive",
        });
        return;
      }

      // Validar e processar dados
      const errors: string[] = [];
      const processedOrders = new Map<string, {
        order: Partial<Order>;
        items: Partial<OrderItem>[];
      }>();

      // Buscar clientes para validação
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name');

      const clientMap = new Map(clients?.map(c => [c.name.toLowerCase(), c.id]) || []);

      // Buscar produtos para validação
      const { data: products } = await supabase
        .from('products')
        .select('id, name');

      const productMap = new Map(products?.map(p => [p.name.toLowerCase(), p.id]) || []);

      data.forEach((row, index) => {
        const rowNum = index + 2; // +2 porque Excel começa em 1 e tem header
        
        // Validações básicas
        if (!row.cliente?.trim()) {
          errors.push(`Linha ${rowNum}: Cliente é obrigatório`);
          return;
        }

        if (!row.produto?.trim()) {
          errors.push(`Linha ${rowNum}: Produto é obrigatório`);
          return;
        }

        if (!row.quantidade || row.quantidade <= 0) {
          errors.push(`Linha ${rowNum}: Quantidade deve ser maior que zero`);
          return;
        }

        if (!row.preco_unitario || row.preco_unitario <= 0) {
          errors.push(`Linha ${rowNum}: Preço unitário deve ser maior que zero`);
          return;
        }

        // Validar se cliente existe
        const clientId = clientMap.get(row.cliente.toLowerCase());
        if (!clientId) {
          errors.push(`Linha ${rowNum}: Cliente "${row.cliente}" não encontrado`);
          return;
        }

        // Validar se produto existe
        const productId = productMap.get(row.produto.toLowerCase());
        if (!productId) {
          errors.push(`Linha ${rowNum}: Produto "${row.produto}" não encontrado`);
          return;
        }

        // Agrupar por número do pedido ou cliente se não tiver número
        const orderKey = row.numero_pedido || `AUTO_${row.cliente}_${index}`;
        
        if (!processedOrders.has(orderKey)) {
          processedOrders.set(orderKey, {
            order: {
              client_id: clientId,
              client_name: row.cliente,
              seller: row.vendedor,
              status: (row.status as any) || 'pending',
              delivery_deadline: row.data_entrega,
              payment_method: row.forma_pagamento,
              payment_term: row.prazo_pagamento,
              notes: row.observacoes,
              total_amount: row.valor_total || 0,
            },
            items: []
          });
        }

        const orderData = processedOrders.get(orderKey)!;
        
        // Adicionar item
        const totalPrice = row.preco_total || (row.quantidade * row.preco_unitario);
        orderData.items.push({
          product_id: productId,
          product_name: row.produto,
          quantity: row.quantidade,
          unit_price: row.preco_unitario,
          total_price: totalPrice,
          user_id: user.id
        });

        // Atualizar total do pedido
        orderData.order.total_amount = (orderData.order.total_amount || 0) + totalPrice;
      });

      if (errors.length > 0) {
        toast({
          title: "Erros encontrados",
          description: `${errors.length} erros encontrados. Verifique os dados.`,
          variant: "destructive",
        });
        console.log('Erros de importação:', errors);
        return;
      }

      // Inserir pedidos no banco
      let successCount = 0;
      const insertErrors: string[] = [];

      for (const [orderKey, { order, items }] of processedOrders) {
        try {
          // Inserir pedido
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([order])
            .select()
            .single();

          if (orderError) throw orderError;

          // Inserir itens
          const itemsWithOrderId = items.map(item => ({
            ...item,
            order_id: orderData.id
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);

          if (itemsError) throw itemsError;

          successCount++;
        } catch (error: any) {
          insertErrors.push(`Pedido ${orderKey}: ${error.message}`);
        }
      }

      if (insertErrors.length > 0) {
        console.log('Erros de inserção:', insertErrors);
      }

      toast({
        title: "Importação concluída",
        description: `${successCount} pedidos importados com sucesso!`,
      });

      return true;
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar os pedidos",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    isExporting,
    orderHeaders,
    generateTemplate,
    exportOrders,
    importOrders,
  };
};