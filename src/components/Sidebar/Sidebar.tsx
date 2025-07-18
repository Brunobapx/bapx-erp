import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChartBar, Users, Package, ShoppingCart, DollarSign, 
  Truck, Calendar, Settings, FileText, Box, Warehouse,
  FilePen, LogOut, Menu, X, BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const { hasAccess, loading: accessLoading } = useModuleAccess();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: ChartBar, label: 'Dashboard', href: '/', route: '/' },
    { icon: Users, label: 'Clientes', href: '/clientes', route: '/clientes' },
    { icon: Package, label: 'Produtos', href: '/produtos', route: '/produtos' },
    { icon: Users, label: 'Fornecedores', href: '/fornecedores', route: '/fornecedores' },
    { icon: ShoppingCart, label: 'Compras', href: '/compras', route: '/compras' },
    { icon: Warehouse, label: 'Estoque', href: '/estoque', route: '/estoque' },
    { icon: Package, label: 'Pedidos', href: '/pedidos', route: '/pedidos' },
    { icon: Box, label: 'Produção', href: '/producao', route: '/producao' },
    { icon: Box, label: 'Embalagem', href: '/embalagem', route: '/embalagem' },
    { icon: DollarSign, label: 'Vendas', href: '/vendas', route: '/vendas' },
    { icon: FilePen, label: 'Emissão Fiscal', href: '/emissao-fiscal', route: '/emissao-fiscal' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro', route: '/financeiro' },
    { icon: FileText, label: 'Trocas', href: '/trocas', route: '/trocas' },
    { icon: Truck, label: 'Rotas', href: '/rotas', route: '/rotas' },
    { icon: Calendar, label: 'Calendário', href: '/calendario', route: '/calendario' },
    { icon: FilePen, label: 'Ordens de Serviço', href: '/ordens-servico', route: '/ordens-servico' },
    { icon: BarChart3, label: 'Relatórios', href: '/relatorios', route: '/relatorios' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes', route: '/configuracoes' }
  ];

  // Filtrar itens baseado nas permissões do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // Admin e Master veem todos os itens
    if (userRole === 'admin' || userRole === 'master') {
      return true;
    }

    // Dashboard e Configurações sempre visíveis para usuários logados
    if (item.route === '/' || item.route === '/configuracoes') {
      return true;
    }

    // Para outros módulos, verificar permissão específica
    return hasAccess(item.route);
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/a627e39d-287e-4e8b-96f3-d8c8f7b7d997.png"
            alt="BAPX ERP"
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">BAPX ERP</h1>
            <p className="text-sm text-gray-500">Gestão Empresarial</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Sair do Sistema
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>

      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
