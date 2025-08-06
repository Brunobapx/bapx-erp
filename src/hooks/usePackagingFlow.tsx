import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PackagingFlowStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';

export type PackagingFlowItem = {
  id: string;
  packaging_number: string;
  order_id?: string;
  order_number?: string;
  client_id?: string;
  client_name?: string;
  product_id: string;
  product_name: string;
  quantity_to_package: number;
  quantity_packaged: number;
  quantity_from_stock: number;
  quantity_from_production: number;
  status: PackagingFlowStatus;
  origin: 'stock' | 'production' | 'mixed';
  packaged_at?: string;
  approved_at?: string;
  packaged_by?: string;
  approved_by?: string;
  quality_check: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  production_id?: string;
  tracking_id?: string;
};

export const usePackagingFlow = () => {
  const [packagings, setPackagings] = useState<PackagingFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackagings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todas as embalagens
      const { data: packagingData, error: packagingError } = await supabase
        .from('packaging')
        .select('*')
        .order('created_at', { ascending: false });

      if (packagingError) throw packagingError;

      const enrichedPackagings: PackagingFlowItem[] = [];

      for (const pack of packagingData || []) {
        let orderData = null;
        let trackingData = null;

        // Se tem production_id, buscar dados do pedido relacionado
        if (pack.production_id) {
          const { data: production, error: prodError } = await supabase
            .from('production')
            .select('order_item_id')
            .eq('id', pack.production_id)
            .maybeSingle();

          if (!prodError && production && production.order_item_id) {
            // Buscar dados do item do pedido e ordem
            const { data: orderItem, error: itemError } = await supabase
              .from('order_items')
              .select(`
                order_id,
                orders!inner (
                  order_number,
                  client_id,
                  client_name
                )
              `)
              .eq('id', production.order_item_id)
              .maybeSingle();

            if (!itemError && orderItem) {
              orderData = orderItem.orders;
            }
            
            // Buscar dados de tracking
            const { data: tracking, error: trackError } = await supabase
              .from('order_item_tracking')
              .select('*')
              .eq('order_item_id', production.order_item_id)
              .maybeSingle();

            if (!trackError && tracking) {
              trackingData = tracking;
            }
          }
        }

        // Determinar origem e quantidades
        let quantityFromStock = 0;
        let quantityFromProduction = pack.quantity_to_package;
        let origin: 'stock' | 'production' | 'mixed' = 'production';

        if (trackingData) {
          quantityFromStock = trackingData.quantity_from_stock || 0;
          quantityFromProduction = trackingData.quantity_from_production || 0;
          
          if (quantityFromStock > 0 && quantityFromProduction > 0) {
            origin = 'mixed';
          } else if (quantityFromStock > 0) {
            origin = 'stock';
          }
        }

        enrichedPackagings.push({
          id: pack.id,
          packaging_number: pack.packaging_number,
          order_id: orderData?.id,
          order_number: orderData?.order_number,
          client_id: orderData?.client_id || pack.client_id,
          client_name: orderData?.client_name || pack.client_name,
          product_id: pack.product_id,
          product_name: pack.product_name,
          quantity_to_package: pack.quantity_to_package,
          quantity_packaged: pack.quantity_packaged || 0,
          quantity_from_stock: quantityFromStock,
          quantity_from_production: quantityFromProduction,
          status: pack.status,
          origin,
          packaged_at: pack.packaged_at,
          approved_at: pack.approved_at,
          packaged_by: pack.packaged_by,
          approved_by: pack.approved_by,
          quality_check: pack.quality_check || false,
          notes: pack.notes,
          created_at: pack.created_at,
          updated_at: pack.updated_at,
          user_id: pack.user_id,
          production_id: pack.production_id,
          tracking_id: pack.tracking_id
        });
      }

      setPackagings(enrichedPackagings);

    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar embalagens:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePackagingStatus = async (
    packagingId: string,
    status: PackagingFlowStatus,
    quantityPackaged?: number,
    qualityCheck?: boolean
  ): Promise<boolean> => {
    try {
      const updateData: any = { status };

      if (status === 'in_progress') {
        updateData.packaged_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          updateData.packaged_by = user.email;
        }
      }

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          updateData.approved_by = user.email;
        }
      }

      if (quantityPackaged !== undefined) {
        updateData.quantity_packaged = quantityPackaged;
      }

      if (qualityCheck !== undefined) {
        updateData.quality_check = qualityCheck;
      }

      const { error } = await supabase
        .from('packaging')
        .update(updateData)
        .eq('id', packagingId);

      if (error) throw error;

      // Se aprovado, liberar para venda
      if (status === 'approved') {
        await handleApprovedPackaging(packagingId);
      }

      toast.success('Status da embalagem atualizado com sucesso!');
      await fetchPackagings();
      return true;

    } catch (err: any) {
      console.error('Erro ao atualizar status da embalagem:', err);
      toast.error('Erro ao atualizar status da embalagem: ' + err.message);
      return false;
    }
  };

  const handleApprovedPackaging = async (packagingId: string) => {
    try {
      // Buscar dados da embalagem
      const { data: packaging, error: packError } = await supabase
        .from('packaging')
        .select('*')
        .eq('id', packagingId)
        .single();

      if (packError) throw packError;

      if (packaging.production_id) {
        // Buscar dados da produção para atualizar tracking
        const { data: production, error: prodError } = await supabase
          .from('production')
          .select('order_item_id')
          .eq('id', packaging.production_id)
          .single();

        if (prodError) throw prodError;

        if (production.order_item_id) {
          // Atualizar tracking do item do pedido
          const { error: trackingError } = await supabase
            .from('order_item_tracking')
            .update({
              quantity_packaged_approved: packaging.quantity_packaged,
              status: 'ready_for_sale',
              updated_at: new Date().toISOString()
            })
            .eq('order_item_id', production.order_item_id);

          if (trackingError) throw trackingError;

          // Verificar se todos os itens do pedido estão prontos para liberar o pedido
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_item_tracking')
            .select('status, order_items!inner(order_id)')
            .eq('order_items.order_id', packaging.order_id);

          if (!itemsError && orderItems) {
            const allReady = orderItems.every(item => item.status === 'ready_for_sale');
            
            if (allReady) {
              // Atualizar status do pedido para liberado para venda
              const { error: orderError } = await supabase
                .from('orders')
                .update({
                  status: 'released_for_sale',
                  updated_at: new Date().toISOString()
                })
                .eq('id', packaging.order_id);

              if (orderError) throw orderError;
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Erro ao processar embalagem aprovada:', err);
      throw err;
    }
  };

  // Funções de filtro para as diferentes abas
  const getFromStock = () => packagings.filter(p => p.origin === 'stock');
  const getFromProduction = () => packagings.filter(p => p.origin === 'production' || p.origin === 'mixed');
  const getInPackaging = () => packagings.filter(p => p.status === 'in_progress');
  const getReady = () => packagings.filter(p => p.status === 'approved' || p.status === 'completed');

  useEffect(() => {
    fetchPackagings();
  }, []);

  return {
    packagings,
    loading,
    error,
    fetchPackagings,
    updatePackagingStatus,
    refreshPackagings: fetchPackagings,
    // Filtros para as abas
    fromStock: getFromStock(),
    fromProduction: getFromProduction(),
    inPackaging: getInPackaging(),
    ready: getReady()
  };
};