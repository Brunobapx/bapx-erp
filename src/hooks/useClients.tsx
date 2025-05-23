
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('useClients - Iniciando busca de clientes...');
        
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
          .order('name', { ascending: true });

        if (error) {
          console.error('useClients - Erro do Supabase:', error);
          throw error;
        }

        console.log('useClients - Dados recebidos do banco:', data);
        
        const clientsData = Array.isArray(data) ? data : [];
        console.log('useClients - Total de clientes carregados:', clientsData.length);
        
        setClients(clientsData);
        
      } catch (err: any) {
        console.error('useClients - Erro ao buscar clientes:', err);
        setError(err.message || 'Erro ao carregar clientes');
        
        // Só mostrar toast de erro se não for problema de autenticação
        if (!err.message?.includes('não autenticado')) {
          toast.error('Erro ao carregar clientes: ' + (err.message || 'Erro desconhecido'));
        }
        
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [refreshTrigger]);

  const refreshClients = () => {
    console.log('useClients - Atualizando lista de clientes...');
    setRefreshTrigger(prev => prev + 1);
  };

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  // Função para buscar clientes com termo de pesquisa
  const searchClients = (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return clients;
    }
    
    const searchString = searchTerm.toLowerCase();
    return clients.filter(client => {
      return (
        (client.name && client.name.toLowerCase().includes(searchString)) ||
        (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
        (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
        (client.email && client.email.toLowerCase().includes(searchString))
      );
    });
  };

  return {
    clients,
    loading,
    error,
    refreshClients,
    getClientById,
    searchClients
  };
};
