
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const fetchUserData = async (userId: string) => {
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          console.log('[AuthProvider] No user, clearing state');
          setUserRole(null);
          setCompanyInfo(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
