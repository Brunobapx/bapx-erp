
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from './CompanyProvider';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
  companyId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { company } = useCompanyContext();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && company?.id) {
          // Fetch user role and company info
          setTimeout(async () => {
            try {
              console.log('Buscando dados do usuário para empresa:', company.id);
              
              // Verificar se o usuário pertence à empresa atual
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.error('Erro ao buscar perfil:', profileError);
                setUserRole('user');
                setCompanyId(null);
                return;
              }

              console.log('Dados do perfil:', profileData);

              // Verificar se o usuário pertence à empresa atual
              if (profileData.company_id !== company.id) {
                console.warn('Usuário não pertence à empresa atual');
                setUserRole(null);
                setCompanyId(null);
                // Fazer logout se o usuário não pertence à empresa
                await supabase.auth.signOut();
                return;
              }

              setCompanyId(profileData.company_id);

              // Buscar role do usuário na empresa
              const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('company_id', company.id)
                .single();

              if (roleError) {
                console.error('Erro ao buscar role:', roleError);
                setUserRole('user');
                return;
              }

              console.log('Role do usuário:', roleData.role);
              setUserRole(roleData.role || 'user');
            } catch (error) {
              console.error('Erro ao buscar dados do usuário:', error);
              setUserRole('user');
              setCompanyId(null);
            }
          }, 0);
        } else {
          setUserRole(null);
          setCompanyId(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [company?.id]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && process.env.NODE_ENV === 'development') {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    userRole,
    companyId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
