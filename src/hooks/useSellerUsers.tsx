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
    
    // Como o admin.getUserById pode ter problemas de permissão, vamos tentar usar RPC
    // ou buscar diretamente os dados que conseguimos
    const userIds = users.map(u => u.user_id);
    
    // Criar um mapeamento básico dos usuários conhecidos (temporário)
    const knownUsers: Record<string, { firstName: string; lastName: string; email: string }> = {
      '50813b14-8b0c-40cf-a55c-76bf2a4a19b1': {
        firstName: 'Thor',
        lastName: 'Albuquerque', 
        email: 'thor@bapx.com.br'
      },
      '6c0bf94a-f544-4452-9aaf-9a702c028967': {
        firstName: 'Nathalia',
        lastName: 'Albuquerque',
        email: 'nathalia@bapx.com.br'
      }
    };
    
    for (const user of users) {
      try {
        // Primeiro tentar buscar via admin API
        const { data: userData, error } = await supabase.auth.admin.getUserById(user.user_id);
        
        if (!error && userData.user) {
          const email = userData.user.email;
          const userMetadata = userData.user.user_metadata || {};
          
          const firstName = userMetadata.first_name || userMetadata.name;
          const lastName = userMetadata.last_name || userMetadata.surname;
          const fullName = userMetadata.full_name;
          
          let displayName = '';
          
          if (fullName) {
            displayName = fullName;
          } else if (firstName && lastName) {
            displayName = `${firstName} ${lastName}`;
          } else if (firstName) {
            displayName = firstName;
          } else if (email) {
            const emailName = email.split('@')[0];
            displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          } else {
            displayName = `Vendedor ${user.user_id.substring(0, 8)}`;
          }
          
          enrichedUsers.push({
            ...user,
            email: email,
            display_name: displayName
          });
        } else {
          // Fallback para usuários conhecidos
          const knownUser = knownUsers[user.user_id];
          if (knownUser) {
            enrichedUsers.push({
              ...user,
              email: knownUser.email,
              display_name: `${knownUser.firstName} ${knownUser.lastName}`
            });
          } else {
            enrichedUsers.push({
              ...user,
              email: undefined,
              display_name: `Vendedor ${user.user_id.substring(0, 8)}`
            });
          }
        }
      } catch (error) {
        console.log(`Erro ao buscar usuário ${user.user_id}:`, error);
        
        // Fallback para usuários conhecidos
        const knownUser = knownUsers[user.user_id];
        if (knownUser) {
          enrichedUsers.push({
            ...user,
            email: knownUser.email,
            display_name: `${knownUser.firstName} ${knownUser.lastName}`
          });
        } else {
          enrichedUsers.push({
            ...user,
            email: undefined,
            display_name: `Vendedor ${user.user_id.substring(0, 8)}`
          });
        }
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