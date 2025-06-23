
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  companyInfo: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUserData = async (currentUser: User) => {
    try {
      console.log('[AuthProvider] Loading user data for:', currentUser.id);

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
        console.log('[AuthProvider] User role loaded:', roleData.role);
      }

      // Get user profile and company
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.id)
        .single();

      if (profileData?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .single();

        if (companyData) {
          setCompanyInfo(companyData);
          console.log('[AuthProvider] Company loaded:', companyData.name);
        }
      }
    } catch (error: any) {
      console.error('[AuthProvider] Error loading user data:', error);
      // Don't show toast for every error, just log it
    }
  };

  useEffect(() => {
    console.log('[AuthProvider] Initializing auth state...');
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('[AuthProvider] Session found, setting user');
          setUser(session.user);
          await loadUserData(session.user);
        } else {
          console.log('[AuthProvider] No session found');
        }
      } catch (error) {
        console.error('[AuthProvider] Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
          setCompanyInfo(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setCompanyInfo(null);
    } catch (error: any) {
      console.error('[AuthProvider] Error signing out:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    userRole,
    companyInfo,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
