
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
    hasValidProfile: false,
    loading: true,
    error: null,
    companyId: null
  });
  const { user } = useAuth();

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) {
        setStatus({
          hasValidProfile: false,
          loading: false,
          error: 'Usuário não autenticado',
          companyId: null
        });
        return;
      }

      try {
        console.log('Verificando perfil do usuário:', user.id);
        
        // Verificar se o usuário tem perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, company_id, first_name, last_name, is_active')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          setStatus({
            hasValidProfile: false,
            loading: false,
            error: 'Perfil do usuário não encontrado',
            companyId: null
          });
          return;
        }

        if (!profile) {
          setStatus({
            hasValidProfile: false,
            loading: false,
            error: 'Perfil do usuário não existe',
            companyId: null
          });
          return;
        }

        if (!profile.company_id) {
          setStatus({
            hasValidProfile: false,
            loading: false,
            error: 'Usuário não está associado a uma empresa',
            companyId: null
          });
          return;
        }

        if (!profile.is_active) {
          setStatus({
            hasValidProfile: false,
            loading: false,
            error: 'Perfil do usuário está inativo',
            companyId: null
          });
          return;
        }

        // Verificar se a empresa existe e está ativa
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, is_active')
          .eq('id', profile.company_id)
          .single();

        if (companyError || !company) {
          console.error('Erro ao buscar empresa:', companyError);
          setStatus({
            hasValidProfile: false,
            loading: false,
            error: 'Empresa não encontrada',
            companyId: null
          });
          return;
        }

        if (!company.is_active) {
          setStatus({
            hasValidProfile: false,
            loading: false,
            error: 'Empresa está inativa',
            companyId: null
          });
          return;
        }

        console.log('Perfil válido encontrado:', {
          userId: user.id,
          companyId: profile.company_id,
          companyName: company.name
        });

        setStatus({
          hasValidProfile: true,
          loading: false,
          error: null,
          companyId: profile.company_id
        });

      } catch (error: any) {
        console.error('Erro inesperado ao verificar perfil:', error);
        setStatus({
          hasValidProfile: false,
          loading: false,
          error: 'Erro inesperado ao verificar perfil do usuário',
          companyId: null
        });
      }
    };

    checkUserProfile();
  }, [user]);

  return status;
};
