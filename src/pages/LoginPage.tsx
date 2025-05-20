import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Lock, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already logged in, redirect to dashboard
        navigate("/");
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Transformar username em um formato de email para funcionar com o Supabase Auth
      const email = `${username}@sistema.interno`;
      
      let authResponse;
      
      if (isSignUp) {
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

      if (isSignUp && data?.user) {
        toast.success("Cadastro realizado", {
          description: "Usuário criado com sucesso."
        });
        // Switch back to login after successful signup
        setIsSignUp(false);
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
        description: error instanceof Error ? error.message : "Usuário ou senha incorretos. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultUsers = async () => {
    setIsCreatingUsers(true);
    try {
      // Criar usuário administrador
      const adminEmail = "admin@sistema.interno";
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: adminEmail,
        password: "admin"
      });

      if (adminError) throw adminError;

      // Verificar se o usuário administrador foi criado
      if (adminData.user) {
        // Atualizar o perfil do usuário para administrador
        const { error: adminProfileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            first_name: 'Admin',
            last_name: ''
          })
          .eq('id', adminData.user.id);

        if (adminProfileError) throw adminProfileError;

        // Criar usuário comum
        const userEmail = "user@sistema.interno";
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: userEmail,
          password: "user"
        });

        if (userError) throw userError;

        // Verificar se o usuário comum foi criado
        if (userData.user) {
          // Atualizar o perfil do usuário para usuário comum
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
            description: "Admin (usuário: admin, senha: admin) e User (usuário: user, senha: user) foram criados com sucesso."
          });
          
          // Pré-preencher os campos de login com os dados do administrador
          setUsername('admin');
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Smooth Production</h1>
          <p className="mt-2 text-muted-foreground">Sistema de Gerenciamento de Produção</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSignUp ? "Criar Conta" : "Entrar no Sistema"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp ? "Preencha seus dados para se cadastrar" : "Digite seu usuário e senha para acessar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text" 
                    placeholder="seu_usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {!isSignUp && (
                    <a href="#" className="text-sm text-primary hover:underline">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? "Cadastrando..." : "Entrando..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    {isSignUp ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
                    {isSignUp ? "Cadastrar" : "Entrar"}
                  </span>
                )}
              </Button>

              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Já tem uma conta? Faça login" : "Não tem uma conta? Cadastre-se"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="text-xs mt-2" 
                  onClick={createDefaultUsers}
                  disabled={isCreatingUsers}
                >
                  {isCreatingUsers ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Criando usuários padrão...
                    </span>
                  ) : "Criar usuários padrão (Admin e User)"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Sistema de ERP para gerenciamento de produção
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
