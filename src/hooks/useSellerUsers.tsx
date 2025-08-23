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

  const loadSellers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando busca por vendedores...');
      
      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('❌ Usuário não autenticado');
        setSellers([]);
        return;
      }

      console.log('👤 Usuário autenticado:', user.id);

      // Buscar usuários da empresa usando o edge function
      const { data: usersResponse, error: usersError } = await supabase.functions.invoke('get-users');
      
      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError);
        throw usersError;
      }

      console.log('👥 Resposta do get-users:', usersResponse);

      if (!usersResponse?.success) {
        console.log('❌ Resposta sem sucesso do get-users:', usersResponse);
        setSellers([]);
        return;
      }

      // Buscar company_id do usuário atual através do perfil
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !currentProfile?.company_id) {
        console.log('❌ Erro ao buscar company_id do usuário atual:', profileError);
        setSellers([]);
        return;
      }

      const userCompanyId = currentProfile.company_id;
      console.log('🏢 Company ID do usuário atual:', userCompanyId);

      // Buscar posições de vendedor para filtrar usuários, aplicando filtro de empresa
      const { data: positionsData, error: positionsError } = await supabase
        .from('user_positions')
        .select('user_id, position, created_at, company_id')
        .eq('position', 'vendedor')
        .eq('company_id', userCompanyId) // Filtro explícito por empresa
        .order('created_at', { ascending: false });

      console.log('🏢 Posições de vendedor da empresa:', { positionsData, positionsError, userCompanyId });

      if (positionsError) {
        console.error('❌ Erro ao buscar posições:', positionsError);
        throw positionsError;
      }

      // Filtrar usuários que são vendedores da mesma empresa
      const sellerUserIds = new Set(positionsData?.map(p => p.user_id) || []);
      const allUsers = usersResponse.users || [];
      
      console.log('🎯 Dados para filtro:', { 
        sellerUserIds: Array.from(sellerUserIds), 
        allUsers: allUsers.length,
        positionsData: positionsData?.map(p => ({ user_id: p.user_id, company_id: p.company_id }))
      });

      const sellerUsers: SellerUser[] = allUsers
        .filter((u: any) => sellerUserIds.has(u.id))
        .map((u: any) => {
          const position = positionsData?.find(p => p.user_id === u.id);
          return {
            user_id: u.id,
            position: 'vendedor',
            created_at: position?.created_at || u.created_at,
            email: u.email,
            display_name: u.user_metadata?.first_name && u.user_metadata?.last_name 
              ? `${u.user_metadata.first_name} ${u.user_metadata.last_name}`
              : u.user_metadata?.first_name || `Vendedor ${u.id.substring(0, 8)}`
          };
        });

      console.log('✨ Vendedores encontrados:', sellerUsers);
      setSellers(sellerUsers);
    } catch (error: any) {
      console.error('❌ Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
      setSellers([]);
    } finally {
      setLoading(false);
      console.log('🏁 Busca por vendedores finalizada');
    }
  };

  useEffect(() => {
    loadSellers();
  }, []); // Hook será executado na montagem do componente

  return {
    sellers,
    loading,
    refetch: loadSellers
  };
};