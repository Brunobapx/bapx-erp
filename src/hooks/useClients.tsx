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
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

async function fetchClients() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
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

  return {
    clients: filteredClients,
    allClients,
    isLoading,
    error: error ? error.message : null,
    searchQuery,
    setSearchQuery,
    refreshClients,
    getClientById,
    searchClients,
    refetch,
  };
};
