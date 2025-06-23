
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { SecureErrorHandler } from '@/lib/security/errorHandler';
import { InputSanitizer } from '@/lib/security/inputSanitizer';
import { toast } from 'sonner';

export interface OptimizedClient {
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

// Optimized cache with better memory management
class ClientsCache {
  private cache = new Map<string, { data: OptimizedClient[]; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): OptimizedClient[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: OptimizedClient[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Cleanup old entries to prevent memory leaks
    if (this.cache.size > 10) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const clientsCache = new ClientsCache();

export const useOptimizedClients = () => {
  const [clients, setClients] = useState<OptimizedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, companyInfo } = useAuth();
  
  // Memoized values to prevent unnecessary re-renders
  const companyId = useMemo(() => companyInfo?.id, [companyInfo?.id]);
  const cacheKey = useMemo(() => `clients_${companyId}`, [companyId]);

  // Memoized cache operations
  const getCachedClients = useCallback((): OptimizedClient[] | null => {
    return clientsCache.get(cacheKey);
  }, [cacheKey]);

  const setCachedClients = useCallback((data: OptimizedClient[]) => {
    clientsCache.set(cacheKey, data);
  }, [cacheKey]);

  // Optimized load function with better error handling
  const loadClients = useCallback(async (useCache: boolean = true) => {
    if (!user || !companyId) {
      setClients([]);
      return;
    }

    // Try cache first
    if (useCache) {
      const cachedClients = getCachedClients();
      if (cachedClients) {
        setClients(cachedClients);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Single optimized query
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (fetchError) {
        SecureErrorHandler.handleApiError(fetchError, 'LoadClients');
      }

      const clientsData = (data || []) as OptimizedClient[];
      setClients(clientsData);
      setCachedClients(clientsData);

    } catch (error: any) {
      const errorMessage = SecureErrorHandler.sanitizeErrorMessage(error);
      setError(errorMessage);
      SecureErrorHandler.logSecureError(error, 'LoadClients', user.id);
      
      toast.error(`Erro ao carregar clientes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [user, companyId, getCachedClients, setCachedClients]);

  // Memoized CRUD operations
  const createClient = useCallback(async (clientData: Omit<OptimizedClient, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const sanitizedData = InputSanitizer.sanitizeFormData(clientData);

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([{
          ...sanitizedData,
          user_id: user.id,
          company_id: companyId,
        }])
        .select()
        .single();

      if (insertError) {
        SecureErrorHandler.handleApiError(insertError, 'CreateClient');
      }

      await loadClients(false);
      toast.success('Cliente criado com sucesso!');
      
      return data;
    } catch (error: any) {
      SecureErrorHandler.logSecureError(error, 'CreateClient', user.id);
      throw error;
    }
  }, [user, companyId, loadClients]);

  const updateClient = useCallback(async (id: string, clientData: Partial<OptimizedClient>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const sanitizedData = InputSanitizer.sanitizeFormData(clientData);

      const { error: updateError } = await supabase
        .from('clients')
        .update(sanitizedData)
        .eq('id', id)
        .eq('company_id', companyId);

      if (updateError) {
        SecureErrorHandler.handleApiError(updateError, 'UpdateClient');
      }

      await loadClients(false);
      toast.success('Cliente atualizado com sucesso!');
    } catch (error: any) {
      SecureErrorHandler.logSecureError(error, 'UpdateClient', user.id);
      throw error;
    }
  }, [user, companyId, loadClients]);

  const deleteClient = useCallback(async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (deleteError) {
        SecureErrorHandler.handleApiError(deleteError, 'DeleteClient');
      }

      await loadClients(false);
      toast.success('Cliente excluído com sucesso!');
    } catch (error: any) {
      SecureErrorHandler.logSecureError(error, 'DeleteClient', user.id);
      throw error;
    }
  }, [user, companyId, loadClients]);

  // Memoized search function
  const searchClients = useCallback((searchTerm: string): OptimizedClient[] => {
    if (!searchTerm?.trim()) return clients;
    
    try {
      const sanitizedSearch = InputSanitizer.sanitizeSearchQuery(searchTerm);
      const searchLower = sanitizedSearch.toLowerCase();
      
      return clients.filter(client => {
        return (
          client.name?.toLowerCase().includes(searchLower) ||
          client.cnpj?.toLowerCase().includes(searchLower) ||
          client.cpf?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower)
        );
      });
    } catch (error) {
      SecureErrorHandler.logSecureError(error, 'SearchClients', user?.id);
      toast.error('Termo de busca inválido');
      return clients;
    }
  }, [clients, user?.id]);

  // Memoized utility functions
  const refreshClients = useCallback(() => {
    loadClients(false);
  }, [loadClients]);

  const clearCache = useCallback(() => {
    clientsCache.clear();
  }, []);

  // Effect with stable dependencies
  useEffect(() => {
    if (companyId) {
      loadClients();
    }
  }, [companyId, loadClients]);

  // Memoized return object
  return useMemo(() => ({
    clients,
    loading,
    error,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    refreshClients,
    clearCache,
  }), [
    clients,
    loading,
    error,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    refreshClients,
    clearCache,
  ]);
};
