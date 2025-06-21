
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type Client = {
  id: string;
  name: string;
  type: 'Física' | 'Jurídica';
  cpf?: string;
  rg?: string;
  cnpj?: string;
  ie?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  bairro?: string;
  number?: string;
  complement?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  company_id?: string;
};

async function fetchClients() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data as Client[] : [];
}

export const useClients = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Padronização do retorno do hook do React Query
  const {
    data: queryData,
    isLoading,
    error,
    refetch
  } = useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 1000 * 60 * 10,
    meta: {
      onError: (err: Error) => {
        if (!err.message.includes('não autenticado')) {
          toast.error('Erro ao carregar clientes: ' + (err.message || 'Erro desconhecido'));
        }
      },
    },
  });

  // Sempre garantir array
  const allClients: Client[] = queryData ?? [];

  const refreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  const getClientById = useCallback(
    (clientId: string) => allClients.find(c => c.id === clientId),
    [allClients]
  );

  const searchClients = useCallback((searchTerm: string) => {
    if (!searchTerm?.trim()) return allClients;
    const searchString = searchTerm.toLowerCase();
    return allClients.filter(client => {
      return (
        (client.name && client.name.toLowerCase().includes(searchString)) ||
        (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
        (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
        (client.email && client.email.toLowerCase().includes(searchString))
      );
    });
  }, [allClients]);

  const filteredClients: Client[] = searchClients(searchQuery);

  // Legacy methods for backward compatibility
  const loadClients = refreshClients;
  const loading = isLoading;

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      await refreshClients();
      toast.success('Cliente criado com sucesso!');
      return data;
    } catch (err: any) {
      toast.error('Erro ao criar cliente: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id);

      if (error) throw error;
      await refreshClients();
      toast.success('Cliente atualizado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar cliente: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshClients();
      toast.success('Cliente excluído com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao excluir cliente: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  return {
    clients: filteredClients,
    allClients,
    isLoading,
    loading, // for backward compatibility
    error: error ? error.message : null,
    searchQuery,
    setSearchQuery,
    refreshClients,
    loadClients, // for backward compatibility
    getClientById,
    searchClients,
    refetch,
    createClient,
    updateClient,
    deleteClient,
  };
};
