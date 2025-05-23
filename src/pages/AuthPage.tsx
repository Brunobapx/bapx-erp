
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        navigate('/');
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if this is the master user
        if (email === 'master@erp.com') {
          // Assign master role to this user
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert([
              { user_id: data.user.id, role: 'master' }
            ], { onConflict: 'user_id,role' });

          if (roleError) {
            console.error('Error assigning master role:', roleError);
          }
        }

        toast.success("Login realizado com sucesso!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user && !data.session) {
          toast.success("Cadastro realizado! Verifique seu email para confirmação.");
        } else {
          toast.success("Cadastro realizado com sucesso!");
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error("Email ou senha incorretos");
      } else if (error.message.includes('User already registered')) {
        toast.error("Este email já está cadastrado");
      } else {
        toast.error(`Erro ao ${isLogin ? 'fazer login' : 'cadastrar'}: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createMasterUser = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'master@erp.com',
        password: 'master123',
      });

      if (error) throw error;

      if (data.user) {
        // Assign master role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert([
            { user_id: data.user.id, role: 'master' }
          ], { onConflict: 'user_id,role' });

        if (roleError) {
          console.error('Error assigning master role:', roleError);
        }

        toast.success("Usuário master criado com sucesso! Email: master@erp.com | Senha: master123");
      }
    } catch (error: any) {
      if (error.message.includes('User already registered')) {
        toast.info("Usuário master já existe. Use: master@erp.com | Senha: master123");
      } else {
        toast.error(`Erro ao criar usuário master: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">ERP</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ERP System</h1>
            <p className="text-gray-600 mt-2">Sistema de Gestão Empresarial</p>
          </div>
        </div>

        {/* Login/Signup Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? 'Fazer Login' : 'Criar Conta'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin ? 'Não tem conta? Criar nova conta' : 'Já tem conta? Fazer login'}
              </Button>
            </div>

            {/* Master User Creation */}
            <div className="mt-6 pt-4 border-t">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Para testes:</p>
                <Button
                  variant="outline"
                  onClick={createMasterUser}
                  disabled={isLoading}
                  className="w-full"
                >
                  Criar Usuário Master de Teste
                </Button>
                <p className="text-xs text-gray-500">
                  Email: master@erp.com | Senha: master123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
