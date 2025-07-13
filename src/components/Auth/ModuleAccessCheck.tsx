
import { useAuth } from './AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock } from 'lucide-react';

interface ModuleAccessCheckProps {
  routePath: string;
  children: React.ReactNode;
}

export const ModuleAccessCheck = ({ routePath, children }: ModuleAccessCheckProps) => {
  const { user } = useAuth();
  const { hasAccess, loading } = useModuleAccess();

  // Verificar se está logado
  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Você precisa estar logado para acessar este módulo.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Dashboard e Configurações sempre acessíveis para usuários logados
  if (routePath === '/' || routePath === '/configuracoes') {
    return <>{children}</>;
  }

  // Verificar permissão específica do módulo (incluindo administradores)
  if (!hasAccess(routePath)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar este módulo. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
