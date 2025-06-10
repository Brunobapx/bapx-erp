
import React, { useEffect, useState } from 'react';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from 'lucide-react';

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoute: string;
}

export const ModuleProtectedRoute = ({ children, requiredRoute }: ModuleProtectedRouteProps) => {
  const { checkModuleAccess } = useModuleAccess();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const access = await checkModuleAccess(requiredRoute);
        setHasAccess(access);
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [requiredRoute, checkModuleAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Seu plano atual não inclui este módulo. 
            Entre em contato com o administrador para obter acesso.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
