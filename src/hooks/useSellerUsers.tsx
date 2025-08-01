import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SellerUser {
  user_id: string;
  position: string;
  created_at: string;
  email?: string;
  display_name?: string;
}

export const useSellerUsers = () => {
  const [sellers, setSellers] = useState<SellerUser[]>([]);
  const [loading, setLoading] = useState(false);

  const enrichUserData = async (users: { user_id: string; position: string; created_at: string }[]): Promise<SellerUser[]> => {
    // Mapeamento dos usuários conhecidos do sistema
    const knownUsers: Record<string, { firstName: string; lastName: string; email: string }> = {
      '50813b14-8b0c-40cf-a55c-76bf2a4a19b1': {
        firstName: 'Thor',
        lastName: 'Albuquerque', 
        email: 'thor@bapx.com.br'
      },
      '6c0bf94a-f544-4452-9aaf-9a702c028967': {
        firstName: 'Nathalia',
        lastName: 'Lopes',
        email: 'nathalia@bapx.com.br'
      },
      '4d5d2bf8-8555-41b1-98be-4ed3f88b4fdf': {
        firstName: 'Nathalia',
        lastName: 'Lopes',
        email: 'nathalia@bapx.com.br'
      }
    };
    
    return users.map(user => {
      const knownUser = knownUsers[user.user_id];
      if (knownUser) {
        return {
          ...user,
          email: knownUser.email,
          display_name: `${knownUser.firstName} ${knownUser.lastName}`
        };
      } else {
        // Para usuários não conhecidos, usar uma abordagem de fallback
        return {
          ...user,
          email: undefined,
          display_name: `Vendedor ${user.user_id.substring(0, 8)}`
        };
      }
    });
  };

  const loadSellers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando busca por vendedores...');
      
      // Buscar usuários com cargo de vendedor na tabela user_positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('user_positions')
        .select('user_id, position, created_at')
        .eq('position', 'vendedor')
        .order('created_at', { ascending: false });

      console.log('📊 Resultado da busca por posições:', { positionsData, positionsError });

      if (positionsError) {
        console.log('❌ Erro ao buscar por posições, tentando buscar por roles:', positionsError);
        
        // Se não encontrar por posições, tentar buscar por roles com 'seller'
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role, created_at')
          .eq('role', 'seller')
          .order('created_at', { ascending: false });

        console.log('📊 Resultado da busca por roles:', { rolesData, rolesError });

        if (rolesError) throw rolesError;
        
        // Mapear roles para o formato esperado
        const mappedRolesData = (rolesData || []).map(item => ({
          user_id: item.user_id,
          position: item.role,
          created_at: item.created_at
        }));
        
        console.log('🔄 Dados mapeados de roles:', mappedRolesData);
        
        // Buscar informações adicionais dos usuários
        const enrichedData = await enrichUserData(mappedRolesData);
        console.log('✨ Dados enriquecidos de roles:', enrichedData);
        setSellers(enrichedData);
      } else {
        console.log('✅ Posições encontradas, enriquecendo dados...');
        // Buscar informações adicionais dos usuários
        const enrichedData = await enrichUserData(positionsData || []);
        console.log('✨ Dados enriquecidos de posições:', enrichedData);
        setSellers(enrichedData);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
    } finally {
      setLoading(false);
      console.log('🏁 Busca por vendedores finalizada');
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