
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanyInfo {
  id: string;
  name: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
  companyInfo: CompanyInfo | null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const { toast } = useToast();

  console.log('[AuthProvider] Component rendered, loading:', loading, 'user:', user?.id);

  const loadUserData = async (userId: string) => {
    try {
      console.log('[AuthProvider] Loading user data for:', userId);
      
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          company_id,
          is_active,
          companies!inner(
            id,
            name,
            status
          )
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[AuthProvider] Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      console.log('[AuthProvider] Profile data loaded:', profileData);

      // Verificar se usuário está ativo
      if (!profileData?.is_active) {
        console.log('[AuthProvider] User is inactive, signing out');
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
        setCompanyInfo(null);
        setLoading(false);
        toast({
          title: "Acesso Negado",
          description: "Sua conta foi desativada. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }

      // Configurar informações da empresa
      if (profileData?.companies) {
        const company = Array.isArray(profileData.companies) ? profileData.companies[0] : profileData.companies;
        console.log('[AuthProvider] Company info set:', company);
        setCompanyInfo({
          id: company.id,
          name: company.name,
          status: company.status
        });
      }

      // Buscar role do usuário
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleError) {
        console.error('[AuthProvider] Error fetching role:', roleError);
        setUserRole('user'); // Default role
      } else {
        const role = roleData?.role || 'user';
        console.log('[AuthProvider] User role set:', role);
        setUserRole(role);
      }

      setLoading(false);
    } catch (error) {
      console.error('[AuthProvider] Error in loadUserData:', error);
      setUserRole('user');
      setCompanyInfo(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Initializing auth...');
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            
            console.log('[AuthProvider] Auth state change:', event, session?.user?.id);
            
            if (session?.user) {
              setUser(session.user);
              setSession(session);
              
              // Verificar se usuário está ativo antes de carregar dados
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('is_active')
                  .eq('id', session.user.id)
                  .single();

                if (!profile?.is_active) {
                  console.log('[AuthProvider] User inactive during state change, signing out');
                  await supabase.auth.signOut();
                  return;
                }

                // Usar setTimeout para evitar problemas de recursão
                setTimeout(() => {
                  if (isMounted) {
                    loadUserData(session.user.id);
                  }
                }, 0);
              } catch (error) {
                console.error('[AuthProvider] Error checking user status:', error);
                setLoading(false);
              }
            } else {
              console.log('[AuthProvider] No session, clearing user data');
              setUser(null);
              setSession(null);
              setUserRole(null);
              setCompanyInfo(null);
              setLoading(false);
            }
          }
        );

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          console.log('[AuthProvider] Found existing session for user:', session.user.id);
          
          // Check if existing user is still active
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_active')
            .eq('id', session.user.id)
            .single();

          if (!profile?.is_active) {
            console.log('[AuthProvider] Existing user is inactive, signing out');
            await supabase.auth.signOut();
            return;
          }

          setUser(session.user);
          setSession(session);
          loadUserData(session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[AuthProvider] Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('[AuthProvider] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthProvider] Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('[AuthProvider] Sign out failed:', error);
      // Don't re-throw, just log the error
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
