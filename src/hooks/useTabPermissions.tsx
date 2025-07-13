import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubModule {
  id: string;
  parent_module_id: string;
  name: string;
  tab_key: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  module_name?: string;
  module_category?: string;
}

export interface UserTabPermissions {
  userId: string;
  tabPermissions: string[]; // array of sub_module_ids
}

export const useTabPermissions = () => {
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('system_sub_modules')
        .select(`
          *,
          system_modules (
            name,
            category
          )
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (fetchError) throw fetchError;

      const formattedData = data?.map(item => ({
        ...item,
        module_name: (item as any).system_modules?.name,
        module_category: (item as any).system_modules?.category
      })) || [];

      setSubModules(formattedData);
    } catch (err: any) {
      console.error('Erro ao buscar sub-módulos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTabPermissions = async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('user_tab_permissions')
        .select('sub_module_id')
        .eq('user_id', userId);

      if (error) throw error;

      return data?.map(item => item.sub_module_id) || [];
    } catch (err: any) {
      console.error('Erro ao buscar permissões de abas:', err);
      return [];
    }
  };

  const updateUserTabPermissions = async (userId: string, subModuleIds: string[]): Promise<void> => {
    try {
      console.log('[useTabPermissions] Iniciando atualização de permissões:', { userId, subModuleIds });
      
      // Primeiro, remover todas as permissões existentes
      const { error: deleteError } = await supabase
        .from('user_tab_permissions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[useTabPermissions] Erro ao deletar permissões existentes:', deleteError);
        throw deleteError;
      }

      console.log('[useTabPermissions] Permissões existentes removidas com sucesso');

      // Depois, inserir as novas permissões
      if (subModuleIds.length > 0) {
        const insertData = subModuleIds.map(subModuleId => ({
          user_id: userId,
          sub_module_id: subModuleId
        }));

        console.log('[useTabPermissions] Inserindo novas permissões:', insertData);

        const { error: insertError, data: insertedData } = await supabase
          .from('user_tab_permissions')
          .insert(insertData);

        if (insertError) {
          console.error('[useTabPermissions] Erro ao inserir novas permissões:', insertError);
          throw insertError;
        }

        console.log('[useTabPermissions] Novas permissões inseridas com sucesso:', insertedData);
      } else {
        console.log('[useTabPermissions] Nenhuma permissão para inserir (array vazio)');
      }

      console.log('[useTabPermissions] Atualização de permissões concluída com sucesso');
    } catch (err: any) {
      console.error('[useTabPermissions] Erro ao atualizar permissões de abas:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSubModules();
  }, []);

  return {
    subModules,
    loading,
    error,
    fetchUserTabPermissions,
    updateUserTabPermissions,
    refetch: fetchSubModules
  };
};