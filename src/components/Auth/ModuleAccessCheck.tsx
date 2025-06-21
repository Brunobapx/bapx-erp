
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from 'lucide-react';

interface ModuleAccessCheckProps {
  routePath: string;
  children: React.ReactNode;
}

export const ModuleAccessCheck = ({ routePath, children }: ModuleAccessCheckProps) => {
  const { user, userRole } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Master e Admin sempre têm acesso a todos os módulos
      if (userRole === 'master' || userRole === 'admin') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Usuários comuns têm acesso a módulos básicos
      const allowedRoutes = [
        '/dashboard',
        '/orders',
        '/sales',
        '/clients',
        '/products',
        '/stock',
        '/production',
        '/packaging',
        '/routes',
        '/finance'
      ];

      // Verificar se a rota atual está na lista de rotas permitidas
      const routeAllowed = allowedRoutes.some(route => routePath.startsWith(route));
      setHasAccess(routeAllowed);
      setLoading(false);
    };

    checkAccess();
  }, [user, userRole, routePath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
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
