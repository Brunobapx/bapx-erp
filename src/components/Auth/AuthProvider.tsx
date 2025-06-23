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

  const loadUserData = async (userId: string) => {
    try {
      console.log('[AuthProvider] Fetching user data for:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          company_id,
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
        return;
      }

      if (profileData?.companies) {
        const company = Array.isArray(profileData.companies) ? profileData.companies[0] : profileData.companies;
        console.log('[AuthProvider] Company info:', company);
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
        console.log('[AuthProvider] User role:', role);
        setUserRole(role);
      }
    } catch (error) {
      console.error('[AuthProvider] Error fetching user data:', error);
      setUserRole('user');
      setCompanyInfo(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            
            console.log('Auth state change:', event, session?.user?.id);
            
            if (session?.user) {
              // Check if user is active when they sign in
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_active, first_name, last_name, company_id, profile_id')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.error('Error fetching user profile:', profileError);
                setUser(null);
                setUserRole(null);
                setCompanyInfo(null);
                setLoading(false);
                return;
              }

              // Block inactive users
              if (!profile.is_active) {
                console.log('User is inactive, blocking access');
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

              // Continue with normal auth flow for active users
              setUser(session.user);
              
              setTimeout(() => {
                if (isMounted) {
                  loadUserData(session.user.id);
                }
              }, 0);
            } else {
              console.log('No session, clearing user data');
              setUser(null);
              setUserRole(null);
              setCompanyInfo(null);
              setLoading(false);
            }
          }
        );

        // Then check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          console.log('Found existing session for user:', session.user.id);
          
          // Check if existing user is still active
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_active')
            .eq('id', session.user.id)
            .single();

          if (!profile?.is_active) {
            console.log('Existing user is inactive, signing out');
            await supabase.auth.signOut();
            return;
          }

          setUser(session.user);
          loadUserData(session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out failed:', error);
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
