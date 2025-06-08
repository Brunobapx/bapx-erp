
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useCompanyContext } from './CompanyProvider';
import { z } from 'zod';

// Input validation schemas
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { company, loading: companyLoading } = useCompanyContext();

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
        // Para signup, precisamos verificar se o usuário foi convidado para esta empresa
        if (!company) {
          throw new Error('Empresa não encontrada');
        }

        // Verificar se existe convite para este email nesta empresa
        const { data: invitation, error: inviteError } = await supabase
          .from('user_invitations')
          .select('*')
          .eq('email', email.trim())
          .eq('company_id', company.id)
          .eq('status', 'pending')
          .single();

        if (inviteError || !invitation) {
          throw new Error('Você não foi convidado para esta empresa ou o convite expirou');
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: undefined // Remove email confirmation
          }
        });

        if (error) throw error;

        // Aceitar o convite após signup bem-sucedido
        await supabase
          .from('user_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);

        toast.success("Cadastro realizado com sucesso!");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Sanitized error messages
      if (error.message.includes('Invalid login credentials')) {
        toast.error("Email ou senha incorretos");
      } else if (error.message.includes('User already registered')) {
        toast.error("Este email já está cadastrado");
      } else if (error.message.includes('não foi convidado')) {
        toast.error(error.message);
      } else {
        toast.error(`Erro ao ${isLogin ? 'fazer login' : 'cadastrar'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while company is being detected
  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Detectando empresa...</p>
        </div>
      </div>
    );
  }

  // Show error if company not found
  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-600 text-xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">Empresa não encontrada</h2>
          <p className="text-gray-600">
            A empresa associada a este subdomínio não foi encontrada ou está inativa.
          </p>
          <p className="text-sm text-gray-500">
            Verifique se o endereço está correto ou entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {company.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
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
                className="w-full"
                style={{
                  backgroundColor: company.primary_color,
                  borderColor: company.primary_color
                }}
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

            {!isLogin && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  📧 Apenas usuários convidados podem criar conta nesta empresa.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
