
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { AuthFormMode } from '@/hooks/useAuthForm';

interface AuthFormProps {
  mode: AuthFormMode;
  email: string;
  password: string;
  isLoading: boolean;
  isCreatingUsers: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
  onCreateDefaultUsers: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  email,
  password,
  isLoading,
  isCreatingUsers,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
  onCreateDefaultUsers
}) => {
  const isSignUp = mode === 'signup';
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {isSignUp ? "Criar Conta" : "Entrar no Sistema"}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUp ? "Preencha seus dados para se cadastrar" : "Digite seu email e senha para acessar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email" 
                placeholder="seu_email@exemplo.com"
                value={email}
                onChange={onEmailChange}
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
                onChange={onPasswordChange}
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
              onClick={onToggleMode}
            >
              {isSignUp ? "Já tem uma conta? Faça login" : "Não tem uma conta? Cadastre-se"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="text-xs mt-2" 
              onClick={onCreateDefaultUsers}
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
  );
};
