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
    const enrichedUsers: SellerUser[] = [];
    
    for (const user of users) {
      try {
        // Buscar informações do usuário através da API
        const { data: userData, error } = await supabase.auth.admin.getUserById(user.user_id);
        
        if (!error && userData.user) {
          const email = userData.user.email;
          // Extrair nome do email (parte antes do @) ou usar user_metadata se disponível
          const emailName = email ? email.split('@')[0] : '';
          const displayName = userData.user.user_metadata?.name || 
                             userData.user.user_metadata?.display_name || 
                             userData.user.user_metadata?.full_name ||
                             emailName ||
                             `Vendedor ${user.user_id.substring(0, 8)}`;
          
          enrichedUsers.push({
            ...user,
            email: email,
            display_name: displayName
          });
        } else {
          // Se não conseguir buscar, usar dados básicos
          enrichedUsers.push({
            ...user,
            email: undefined,
            display_name: `Vendedor ${user.user_id.substring(0, 8)}`
          });
        }
      } catch (error) {
        console.log(`Erro ao buscar usuário ${user.user_id}:`, error);
        enrichedUsers.push({
          ...user,
          email: undefined,
          display_name: `Vendedor ${user.user_id.substring(0, 8)}`
        });
      }
    }
    
    return enrichedUsers;
  };

  const loadSellers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários com cargo de vendedor na tabela user_positions
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
        
        // Buscar informações adicionais dos usuários
        const enrichedData = await enrichUserData(mappedRolesData);
        setSellers(enrichedData);
      } else {
        // Buscar informações adicionais dos usuários
        const enrichedData = await enrichUserData(positionsData || []);
        setSellers(enrichedData);
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