import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
  userPosition: string | null;
  userModules: string[];
  isAdmin: boolean;
  isMaster: boolean;
  isSeller: boolean;
  refreshUserData: () => Promise<void>;
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
  const [userPosition, setUserPosition] = useState<string | null>(null);
  const [userModules, setUserModules] = useState<string[]>([]);

  const isAdmin = userRole === 'admin';
  const isMaster = userRole === 'master';
  const isSeller = userPosition === 'vendedor';

  const fetchUserData = async (userId: string) => {
    try {
      // Buscar role do usuário
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('[AuthProvider] Erro ao buscar role:', roleError);
        setUserRole('user');
      } else {
        setUserRole(roleData?.role || 'user');
      }

      // Buscar posição do usuário
      const { data: positionData, error: positionError } = await supabase
        .from('user_positions')
        .select('position')
        .eq('user_id', userId)
        .maybeSingle();

      if (positionError) {
        console.error('[AuthProvider] Erro ao buscar posição:', positionError);
        setUserPosition(null);
      } else {
        setUserPosition(positionData?.position || null);
      }

      // Se for admin ou master, não precisa buscar permissões específicas
      if (roleData?.role === 'admin' || roleData?.role === 'master') {
        setUserModules([]);
        return;
      }

      // Buscar permissões de módulos para usuários normais
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_module_permissions')
        .select(`
          system_modules (
            name
          )
        `)
        .eq('user_id', userId);

      if (permissionsError) {
        console.error('[AuthProvider] Erro ao buscar permissões:', permissionsError);
        setUserModules([]);
      } else {
        const modules = permissions?.map((p: any) => p.system_modules?.name).filter(Boolean) || [];
        setUserModules(modules);
      }
    } catch (error) {
      console.error('[AuthProvider] Erro ao buscar dados do usuário:', error);
      setUserRole('user');
      setUserPosition(null);
      setUserModules([]);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Buscar dados do usuário quando autenticado
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserPosition(null);
          setUserModules([]);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthProvider] Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Buscar dados do usuário se já estiver logado
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('[AuthProvider] Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
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
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    userRole,
    userPosition,
    userModules,
    isAdmin,
    isMaster,
    isSeller,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};