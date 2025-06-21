
import { useAuth } from '@/components/Auth/AuthProvider';

export const useSimplePermissions = () => {
  const { userRole } = useAuth();

  const hasAccess = (routePath: string) => {
    // Master e Admin têm acesso total
    if (userRole === 'master' || userRole === 'admin') {
      return true;
    }

    // Dashboard e configurações sempre acessíveis
    if (routePath === '/' || routePath === '/configuracoes') {
      return true;
    }

    // Usuários comuns têm acesso limitado
    const allowedRoutes = [
      '/pedidos',
      '/produtos', 
      '/clientes',
      '/vendas',
      '/calendario'
    ];

    return allowedRoutes.includes(routePath);
  };

  const getAllowedRoutes = () => {
    if (userRole === 'master' || userRole === 'admin') {
      return [
        '/', '/pedidos', '/produtos', '/clientes', '/producao', 
        '/embalagem', '/vendas', '/financeiro', '/rotas', '/calendario',
        '/configuracoes', '/fornecedores', '/compras', '/estoque',
        '/emissao-fiscal', '/ordens-servico'
      ];
    }

    return ['/', '/pedidos', '/produtos', '/clientes', '/vendas', '/calendario', '/configuracoes'];
  };

  return {
    hasAccess,
    getAllowedRoutes,
    userRole,
  };
};
