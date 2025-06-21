
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from 'lucide-react';

interface ModuleAccessCheckProps {
  routePath: string;
  children: React.ReactNode;
  requirePermission?: 'view' | 'edit' | 'delete';
}

export const ModuleAccessCheck = ({ 
  routePath, 
  children, 
  requirePermission = 'view' 
}: ModuleAccessCheckProps) => {
  const { user, userRole } = useAuth();
  const { hasAccess, loading } = useUserPermissions();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

  // Rotas que sempre devem ser acessíveis
  const publicRoutes = ['/', '/configuracoes'];

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAccessGranted(false);
        return;
      }

      // Dashboard e configurações sempre acessíveis
      if (publicRoutes.includes(routePath)) {
        setAccessGranted(true);
        return;
      }

      // Master e Admin têm acesso total
      if (userRole === 'master' || userRole === 'admin') {
        setAccessGranted(true);
        return;
      }

      // Verificar acesso usando o hook de permissões
      const access = hasAccess(routePath, requirePermission);
      setAccessGranted(access);
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, userRole, routePath, requirePermission, hasAccess, loading, publicRoutes]);

  // Mostrar loading apenas se ainda não determinou o acesso
  if (loading || accessGranted === null) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar este módulo. Entre em contato com o administrador do sistema para solicitar acesso.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
