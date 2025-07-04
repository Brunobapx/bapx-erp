
import { useAuth } from './AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from 'lucide-react';

interface ModuleAccessCheckProps {
  routePath: string;
  children: React.ReactNode;
}

export const ModuleAccessCheck = ({ routePath, children }: ModuleAccessCheckProps) => {
  const { user } = useAuth();

  // Sem sistema de usuários, apenas verificar se está logado
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

  // Retornar children diretamente - sem verificação de permissões
  return <>{children}</>;
};
