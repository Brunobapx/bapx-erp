
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { z } from 'zod';

// Input validation schemas
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
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

  const validateInputs = () => {
    const errors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.email = error.errors[0]?.message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.password = error.errors[0]?.message;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: undefined // Remove email confirmation
          }
        });

        if (error) throw error;

        toast.success("Cadastro realizado com sucesso!");
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth error:', error);
      }
      
      // Sanitized error messages
      if (error.message.includes('Invalid login credentials')) {
        toast.error("Email ou senha incorretos");
      } else if (error.message.includes('User already registered')) {
        toast.error("Este email já está cadastrado");
      } else {
        toast.error(`Erro ao ${isLogin ? 'fazer login' : 'cadastrar'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eaf7fb] to-[#93d3e7] p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <img
            src="/lovable-uploads/a627e39d-287e-4e8b-96f3-d8c8f7b7d997.png"
            alt="BAPX ERP logo"
            className="mx-auto w-28 h-28 object-contain rounded-2xl shadow-lg bg-white"
            style={{ background: '#eaf7fb', padding: '0.75rem' }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BAPX ERP</h1>
            <p className="text-gray-600 mt-2">Solução em Segurança e TI</p>
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
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
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
                  className={validationErrors.password ? 'border-red-500' : ''}
                />
                {validationErrors.password && (
                  <p className="text-sm text-red-500">{validationErrors.password}</p>
                )}
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

            {/* Development Notice */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-center space-y-2">
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Ambiente de desenvolvimento
                  </p>
                  <p className="text-xs text-gray-500">
                    Para criar um usuário administrador, use o painel do Supabase
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
