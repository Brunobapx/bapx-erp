import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SellerUser {
  user_id: string;
  position: string;
  created_at: string;
}

export const useSellerUsers = () => {
  const [sellers, setSellers] = useState<SellerUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSellers = async () => {
    try {
      setLoading(true);
      
      // Primeiro vamos buscar usuários com cargo de vendedor na tabela user_positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('user_positions')
        .select('user_id, position, created_at')
        .eq('position', 'vendedor')
        .order('created_at', { ascending: false });

      if (positionsError) {
        console.log('Erro ao buscar por posições, tentando buscar por roles:', positionsError);
        
        // Se não encontrar por posições, tentar buscar por roles com 'seller'
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role, created_at')
          .eq('role', 'seller')
          .order('created_at', { ascending: false });

        if (rolesError) throw rolesError;
        // Mapear roles para o formato esperado
        const mappedRolesData = (rolesData || []).map(item => ({
          user_id: item.user_id,
          position: item.role,
          created_at: item.created_at
        }));
        setSellers(mappedRolesData);
      } else {
        setSellers(positionsData || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  return {
    sellers,
    loading,
    refetch: loadSellers
  };
};