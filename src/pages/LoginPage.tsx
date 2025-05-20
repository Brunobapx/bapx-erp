
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface User {
  email: string;
  password: string;
}

// Mock users for demonstration purposes
const mockUsers: User[] = [
  { email: "admin@example.com", password: "admin123" },
  { email: "user@example.com", password: "user123" }
];

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call with timeout
    setTimeout(() => {
      const user = mockUsers.find(
        (user) => user.email === email && user.password === password
      );

      if (user) {
        // Successfully authenticated
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo ao sistema de ERP.",
        });
        
        // Use the login function from auth context
        login(user.email);
        
        // Redirect to dashboard
        navigate("/");
      } else {
        // Authentication failed
        toast({
          title: "Falha no login",
          description: "E-mail ou senha incorretos. Tente novamente.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
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
            <CardTitle className="text-2xl text-center">Entrar no Sistema</CardTitle>
            <CardDescription className="text-center">
              Digite seu e-mail e senha para acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  <a href="#" className="text-sm text-primary hover:underline">
                    Esqueceu a senha?
                  </a>
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
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </span>
                )}
              </Button>

              <div className="text-center">
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
