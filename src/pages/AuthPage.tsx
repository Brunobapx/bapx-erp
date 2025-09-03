
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthPageLogic } from './useAuthPageLogic';

const AuthPage = () => {
  const {
    email, setEmail,
    password, setPassword,
    isLoading,
    validationErrors,
    handleSubmit,
  } = useAuthPageLogic();

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
            width="112"
            height="112"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BAPX ERP</h1>
            <p className="text-gray-600 mt-2">Solução em Segurança e TI</p>
          </div>
        </div>
        {/* Login Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">
              Fazer Login
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
                className="w-full bg-[#93d3e7] hover:bg-[#7bc5dd] text-white font-bold transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Aguarde...' : 'Entrar'}
              </Button>
            </form>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-center space-y-2">
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Ambiente de desenvolvimento
                  </p>
                  <p className="text-xs text-gray-500">
                    Para criar novos usuários, administradores devem usar o sistema interno
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
