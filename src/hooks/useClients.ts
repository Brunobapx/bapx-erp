
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

interface Client {
  id: string;
  name: string;
  type: 'PF' | 'PJ';
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
  const { toast } = useToast();
  const { user } = useAuth();

  const loadClients = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
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
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar clientes",
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

  useEffect(() => {
    loadClients();
  }, [user]);

  return {
    clients,
    loading,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
  };
};
