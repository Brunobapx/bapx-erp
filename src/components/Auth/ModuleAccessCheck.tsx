
import { useAuth } from './AuthProvider';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from 'lucide-react';

interface ModuleAccessCheckProps {
  routePath: string;
  children: React.ReactNode;
}

export const ModuleAccessCheck = ({ routePath, children }: ModuleAccessCheckProps) => {
  const { user } = useAuth();
  const { hasAccess, loading } = useProfilePermissions();

  console.log('[ModuleAccessCheck] Checking access for route:', routePath);
  console.log('[ModuleAccessCheck] User:', user?.email);

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

  // Mostrar loading enquanto carrega permissões
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasPageAccess = hasAccess(routePath);
  console.log('[ModuleAccessCheck] Has access to', routePath, ':', hasPageAccess);

  if (!hasPageAccess) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar este módulo. Verifique seu perfil de acesso.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
