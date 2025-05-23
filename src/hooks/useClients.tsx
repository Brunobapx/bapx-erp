
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('useClients - Iniciando busca de clientes...');
        
        // Verificar se o usuário está autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('useClients - Erro de autenticação:', userError);
          throw new Error('Usuário não autenticado');
        }
        
        if (!user) {
          console.error('useClients - Usuário não encontrado');
          throw new Error('Usuário não encontrado');
        }
        
        console.log('useClients - Usuário autenticado:', user.id);

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('useClients - Erro do Supabase:', error);
          throw error;
        }

        console.log('useClients - Dados recebidos do banco:', data);
        
        // Ensure we always have a valid array
        const clientsData = Array.isArray(data) ? data : [];
        console.log('useClients - Total de clientes carregados:', clientsData.length);
        
        if (clientsData.length === 0) {
          console.log('useClients - Nenhum cliente encontrado para este usuário');
        }
        
        setClients(clientsData);
        
      } catch (err: any) {
        console.error('useClients - Erro ao buscar clientes:', err);
        setError(err.message || 'Erro ao carregar clientes');
        toast.error('Erro ao carregar clientes: ' + (err.message || 'Erro desconhecido'));
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [refreshTrigger]);

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    if (!client || !searchQuery) return true;
    
    const searchString = searchQuery.toLowerCase();
    return (
      (client.name && client.name.toLowerCase().includes(searchString)) ||
      (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
      (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
      (client.email && client.email.toLowerCase().includes(searchString))
    );
  });

  // Refresh clients list
  const refreshClients = () => {
    console.log('useClients - Atualizando lista de clientes...');
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    clients: filteredClients,
    allClients: clients,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refreshClients
  };
};
