
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type AuthFormMode = 'login' | 'signup';

export const useAuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [mode, setMode] = useState<AuthFormMode>('login');
  const navigate = useNavigate();
  const { login } = useAuth();

  const toggleMode = () => setMode(mode === 'login' ? 'signup' : 'login');

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let authResponse;
      
      if (mode === 'signup') {
        // Sign up new user
        authResponse = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        // Sign in existing user
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      const { data, error } = authResponse;

      if (error) {
        throw error;
      }

      if (mode === 'signup' && data?.user) {
        toast.success("Cadastro realizado", {
          description: "Usuário criado com sucesso."
        });
        // Switch back to login after successful signup
        setMode('login');
      } else if (data?.user) {
        // Successfully authenticated
        toast.success("Login bem-sucedido", {
          description: "Bem-vindo ao sistema de ERP."
        });
        
        // Use the login function from auth context
        login(data.user.email!);
        
        // Redirect to dashboard
        navigate("/");
      }
    } catch (error) {
      // Authentication failed
      console.error("Erro de autenticação:", error);
      toast.error("Falha na autenticação", {
        description: error instanceof Error ? error.message : "Email ou senha incorretos. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultUsers = async () => {
    setIsCreatingUsers(true);
    try {
      // Create admin user
      const adminEmail = "admin@sistema.interno";
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: adminEmail,
        password: "admin"
      });

      if (adminError) throw adminError;

      // Check if admin user was created
      if (adminData.user) {
        // Update user profile to admin
        const { error: adminProfileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            first_name: 'Admin',
            last_name: ''
          })
          .eq('id', adminData.user.id);

        if (adminProfileError) throw adminProfileError;

        // Create regular user
        const userEmail = "user@sistema.interno";
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: userEmail,
          password: "user"
        });

        if (userError) throw userError;

        // Check if regular user was created
        if (userData.user) {
          // Update user profile to regular user
          const { error: userProfileError } = await supabase
            .from('profiles')
            .update({ 
              role: 'user',
              first_name: 'User',
              last_name: ''
            })
            .eq('id', userData.user.id);

          if (userProfileError) throw userProfileError;

          toast.success("Usuários padrão criados", {
            description: "Admin (email: admin@sistema.interno, senha: admin) e User (email: user@sistema.interno, senha: user) foram criados com sucesso."
          });
          
          // Pre-fill login fields with admin data
          setEmail('admin@sistema.interno');
          setPassword('admin');
        }
      }
    } catch (error) {
      console.error('Erro ao criar usuários padrão:', error);
      toast.error("Erro ao criar usuários padrão", {
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar os usuários padrão"
      });
    } finally {
      setIsCreatingUsers(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    isCreatingUsers,
    mode,
    handleAuthentication,
    toggleMode,
    createDefaultUsers
  };
};
