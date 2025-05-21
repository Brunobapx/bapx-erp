
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

        const { data, error } = await supabase
          .from('clients')
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          console.log("Clientes carregados:", data.length);
          setClients(data);
        }
      } catch (err: any) {
        console.error('Error fetching clients:', err);
        setError(err.message || 'Erro ao carregar clientes');
        toast.error('Erro ao carregar clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [refreshTrigger]);

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const searchString = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchString) ||
      (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
      (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
      (client.email && client.email.toLowerCase().includes(searchString))
    );
  });

  // Refresh clients list
  const refreshClients = () => {
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
