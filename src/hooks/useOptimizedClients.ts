
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

// Simple in-memory cache with TTL
const clientsCache = new Map<string, { data: OptimizedClient[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useOptimizedClients = () => {
  const [clients, setClients] = useState<OptimizedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, companyInfo } = useAuth();
  
  const companyId = useMemo(() => companyInfo?.id, [companyInfo?.id]);
  const cacheKey = useMemo(() => `clients_${companyId}`, [companyId]);

  // Get clients from cache if valid
  const getCachedClients = useCallback((): OptimizedClient[] | null => {
    const cached = clientsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Save clients to cache
  const setCachedClients = useCallback((data: OptimizedClient[]) => {
    clientsCache.set(cacheKey, { data, timestamp: Date.now() });
  }, [cacheKey]);

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

  const createClient = useCallback(async (clientData: Omit<OptimizedClient, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Sanitize input data
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

      // Refresh clients after creation
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
      // Sanitize input data
      const sanitizedData = InputSanitizer.sanitizeFormData(clientData);

      const { error: updateError } = await supabase
        .from('clients')
        .update(sanitizedData)
        .eq('id', id)
        .eq('company_id', companyId); // Ensure user can only update their company's clients

      if (updateError) {
        SecureErrorHandler.handleApiError(updateError, 'UpdateClient');
      }

      // Refresh clients after update
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
        .eq('company_id', companyId); // Ensure user can only delete their company's clients

      if (deleteError) {
        SecureErrorHandler.handleApiError(deleteError, 'DeleteClient');
      }

      // Refresh clients after deletion
      await loadClients(false);
      toast.success('Cliente excluído com sucesso!');
    } catch (error: any) {
      SecureErrorHandler.logSecureError(error, 'DeleteClient', user.id);
      throw error;
    }
  }, [user, companyId, loadClients]);

  // Search clients with sanitized input
  const searchClients = useCallback((searchTerm: string): OptimizedClient[] => {
    if (!searchTerm?.trim()) return clients;
    
    try {
      // Sanitize search term
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

  const refreshClients = useCallback(() => {
    loadClients(false);
  }, [loadClients]);

  const clearCache = useCallback(() => {
    clientsCache.delete(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    if (companyId) {
      loadClients();
    }
  }, [companyId, loadClients]);

  return {
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
  };
};
