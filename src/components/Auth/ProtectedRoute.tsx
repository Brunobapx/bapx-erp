
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useCompanyContext } from './CompanyProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading, companyId } = useAuth();
  const { company, loading: companyLoading } = useCompanyContext();

  // Mostrar loading enquanto carrega empresa e autenticação
  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não encontrou a empresa, mostrar erro
  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
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

  // Se não tem usuário autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se usuário não pertence à empresa, mostrar erro
  if (user && companyId !== company.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-yellow-600 text-xl">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900">Acesso Negado</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta empresa.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o administrador da empresa.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
