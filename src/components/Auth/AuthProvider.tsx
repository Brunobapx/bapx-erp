
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

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

  // Controle de debounce e proteção contra loops
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    // Proteção contra loops - evitar múltiplas chamadas para o mesmo usuário
    if (isFetchingRef.current && lastFetchedUserIdRef.current === userId) {
      console.log('[AuthProvider] Fetch already in progress for user:', userId);
      return;
    }

    // Cancelar fetch anterior se existir
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce de 300ms
    fetchTimeoutRef.current = setTimeout(async () => {
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        lastFetchedUserIdRef.current = userId;
        
        console.log('[AuthProvider] Fetching user data for:', userId);
        
        // Usar Promise.allSettled para executar ambas queries em paralelo
        const [profileResult, roleResult] = await Promise.allSettled([
          supabase
            .from('profiles')
            .select(`
              company_id,
              profile_id,
              companies!inner(
                id,
                name,
                status
              ),
              access_profiles(
                id,
                name,
                description
              )
            `)
            .eq('id', userId)
            .single(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single()
        ]);

        // Processar resultado do perfil
        if (profileResult.status === 'fulfilled' && profileResult.value.data?.companies) {
          const company = Array.isArray(profileResult.value.data.companies) 
            ? profileResult.value.data.companies[0] 
            : profileResult.value.data.companies;
          
          console.log('[AuthProvider] Company info loaded:', company);
          console.log('[AuthProvider] User profile:', profileResult.value.data.access_profiles);
          
          setCompanyInfo({
            id: company.id,
            name: company.name,
            status: company.status
          });
        } else {
          console.warn('[AuthProvider] No company info found');
          setCompanyInfo(null);
        }

        // Processar resultado do role
        if (roleResult.status === 'fulfilled' && roleResult.value.data) {
          const role = roleResult.value.data.role || 'user';
          console.log('[AuthProvider] User role loaded:', role);
          setUserRole(role);
        } else {
          console.warn('[AuthProvider] No role found, setting default');
          setUserRole('user');
        }

      } catch (error) {
        console.error('[AuthProvider] Error fetching user data:', error);
        setUserRole('user');
        setCompanyInfo(null);
      } finally {
        isFetchingRef.current = false;
      }
    }, 300);
  }, []);

  // Cleanup function para cancelar requests pendentes
  const cleanup = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    isFetchingRef.current = false;
    lastFetchedUserIdRef.current = null;
  }, []);

  useEffect(() => {
    let isSubscriptionActive = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isSubscriptionActive) return;
        
        console.log('[AuthProvider] Auth state changed:', event, session?.user?.email);
        
        // Sempre atualizar session e user primeiro
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Usar setTimeout para evitar bloquear o auth state change
          setTimeout(() => {
            if (isSubscriptionActive) {
              fetchUserData(session.user.id);
            }
          }, 50);
        } else {
          console.log('[AuthProvider] No user, clearing state');
          cleanup();
          setUserRole(null);
          setCompanyInfo(null);
        }
        
        // Definir loading como false após processar
        if (isSubscriptionActive) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isSubscriptionActive) return;
        
        console.log('[AuthProvider] Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          fetchUserData(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('[AuthProvider] Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription
    return () => {
      console.log('[AuthProvider] Cleaning up subscription');
      isSubscriptionActive = false;
      cleanup();
      subscription.unsubscribe();
    };
  }, [fetchUserData, cleanup]);

  const signOut = async () => {
    try {
      cleanup(); // Limpar requests pendentes
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out failed:', error);
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
