
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
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
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Função para configurar timeout da sessão
  const setupSessionTimeout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    // Timeout de 30 minutos (1800 segundos)
    const timeout = setTimeout(async () => {
      console.log('Sessão expirada por inatividade');
      await signOut();
    }, 30 * 60 * 1000);
    
    setSessionTimeout(timeout);
  };

  // Função para resetar timeout em atividade do usuário
  const resetSessionTimeout = () => {
    if (session?.user) {
      setupSessionTimeout();
    }
  };

  useEffect(() => {
    // Configurar listeners de atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetTimeout = () => resetSessionTimeout();
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Log evento de login para auditoria
          await supabase.rpc('log_security_event', {
            action_name: 'USER_LOGIN',
            table_name: 'auth.users',
            record_id: session.user.id,
            old_data: null,
            new_data: { 
              event: event,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          });

          // Configurar timeout da sessão
          setupSessionTimeout();

          // Fetch user role
          setTimeout(async () => {
            try {
              const { data: roleData } = await supabase
                .rpc('get_current_user_role');
              setUserRole(roleData || 'user');
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching user role:', error);
              }
              setUserRole('user');
            }
          }, 0);
        } else {
          setUserRole(null);
          if (sessionTimeout) {
            clearTimeout(sessionTimeout);
            setSessionTimeout(null);
          }
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setupSessionTimeout();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, []);

  const signOut = async () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }

    // Log evento de logout para auditoria
    if (user) {
      await supabase.rpc('log_security_event', {
        action_name: 'USER_LOGOUT',
        table_name: 'auth.users',
        record_id: user.id,
        old_data: null,
        new_data: { 
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });
    }

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
