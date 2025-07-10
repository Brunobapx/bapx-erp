
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface UserProfileStatus {
  hasValidProfile: boolean;
  loading: boolean;
  error: string | null;
  companyId: string | null;
}

export const useUserProfile = () => {
  const [status, setStatus] = useState<UserProfileStatus>({
    hasValidProfile: true, // Sempre válido já que não temos estrutura de companies/profiles
    loading: false,
    error: null,
    companyId: null
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setStatus({
        hasValidProfile: false,
        loading: false,
        error: 'Usuário não autenticado',
        companyId: null
      });
      return;
    }

    // Sistema simplificado - usuário autenticado sempre tem perfil válido
    setStatus({
      hasValidProfile: true,
      loading: false,
      error: null,
      companyId: user.id // Usar user.id como company_id para compatibilidade
    });
  }, [user]);

  return status;
};
