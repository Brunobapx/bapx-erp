
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
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

      // Master e Admin sempre têm acesso
      if (userRole === 'master' || userRole === 'admin') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('user_has_module_access', {
            _user_id: user.id,
            _route_path: routePath
          });

        if (error) throw error;
        setHasAccess(data);
      } catch (error) {
        console.error('Erro ao verificar acesso ao módulo:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
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
