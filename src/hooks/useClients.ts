
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Client {
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
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const loadClients = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('[useClients] Carregando clientes da empresa');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;

      console.log('[useClients] Clientes carregados:', data?.length);
      setClients(data || []);
    } catch (error: any) {
      console.error('[useClients] Erro ao carregar clientes:', error);
      const errorMessage = error.message || "Erro ao carregar clientes";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await loadClients();
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!",
      });

      return data;
    } catch (error: any) {
      console.error('[useClients] Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id);

      if (error) throw error;

      await loadClients();
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });
    } catch (error: any) {
      console.error('[useClients] Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadClients();
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });
    } catch (error: any) {
      console.error('[useClients] Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const searchClients = useCallback((searchTerm: string) => {
    if (!searchTerm?.trim()) return clients;
    const searchString = searchTerm.toLowerCase();
    return clients.filter(client => {
      return (
        (client.name && client.name.toLowerCase().includes(searchString)) ||
        (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
        (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
        (client.email && client.email.toLowerCase().includes(searchString))
      );
    });
  }, [clients]);

  const filteredClients = searchClients(searchQuery);
  const refreshClients = loadClients;

  useEffect(() => {
    loadClients();
  }, [user]);

  return {
    clients: filteredClients,
    allClients: clients,
    loading,
    isLoading: loading, // alias for backward compatibility
    error,
    searchQuery,
    setSearchQuery,
    loadClients,
    refreshClients,
    getClientById,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
  };
};
