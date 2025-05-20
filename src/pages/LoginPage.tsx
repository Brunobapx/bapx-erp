
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
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
        toast({
          title: "Cadastro realizado",
          description: "Verifique seu e-mail para confirmar o cadastro.",
        });
        // Switch back to login after successful signup
        setIsSignUp(false);
      } else if (data?.user) {
        // Successfully authenticated
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo ao sistema de ERP.",
        });
        
        // Use the login function from auth context
        login(data.user.email!);
        
        // Redirect to dashboard
        navigate("/");
      }
    } catch (error) {
      // Authentication failed
      console.error("Erro de autenticação:", error);
      toast({
        title: "Falha na autenticação",
        description: error instanceof Error ? error.message : "E-mail ou senha incorretos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAdminUser = async () => {
    setIsCreatingAdmin(true);
    try {
      // Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'bruno@bapx.com.br',
        password: '123456'
      });

      if (authError) throw authError;

      // Verificar se o usuário foi criado
      if (authData.user) {
        // Atualizar o perfil do usuário para administrador
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            first_name: 'Bruno',
            last_name: 'Admin'
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        toast({
          title: "Usuário administrador criado",
          description: "Bruno foi criado como administrador geral do sistema. Email: bruno@bapx.com.br, Senha: 123456",
        });
        
        // Pré-preencher os campos de login com os dados do administrador
        setEmail('bruno@bapx.com.br');
        setPassword('123456');
      }
    } catch (error) {
      console.error('Erro ao criar usuário administrador:', error);
      toast({
        title: "Erro ao criar administrador",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o usuário administrador",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAdmin(false);
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
              {isSignUp ? "Preencha seus dados para se cadastrar" : "Digite seu e-mail e senha para acessar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email" 
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  onClick={createAdminUser}
                  disabled={isCreatingAdmin}
                >
                  {isCreatingAdmin ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Criando administrador...
                    </span>
                  ) : "Criar usuário administrador Bruno"}
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
