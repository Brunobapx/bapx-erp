
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface CompanyInfo {
  id: string;
  name: string;
  status: string;
  vencimento?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
  companyInfo: CompanyInfo | null;
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar informações do usuário e empresa
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select(`
                  company_id,
                  perfil_id,
                  companies!inner(
                    id,
                    name,
                    status,
                    vencimento
                  ),
                  perfis(
                    nome,
                    is_admin
                  )
                `)
                .eq('id', session.user.id)
                .single();

              if (profileData?.companies) {
                setCompanyInfo(profileData.companies as CompanyInfo);
              }

              if (profileData?.perfis) {
                setUserRole(profileData.perfis.is_admin ? 'admin' : 'user');
              } else {
                // Fallback para o sistema antigo
                const { data: roleData } = await supabase
                  .rpc('get_current_user_role');
                setUserRole(roleData || 'user');
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching user data:', error);
              }
              setUserRole('user');
            }
          }, 0);
        } else {
          setUserRole(null);
          setCompanyInfo(null);
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
  }, []);

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
    companyInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
