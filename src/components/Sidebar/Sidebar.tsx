
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChartBar, Users, Package, ShoppingCart, DollarSign, 
  Truck, Calendar, Settings, FileText, Box, Warehouse,
  FilePen, User, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const { getAllowedRoutes, loading } = useUserPermissions();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: ChartBar, label: 'Dashboard', href: '/', iconName: 'ChartBar' },
    { icon: Users, label: 'Clientes', href: '/clientes', iconName: 'User' },
    { icon: Package, label: 'Produtos', href: '/produtos', iconName: 'Package' },
    { icon: Users, label: 'Fornecedores', href: '/fornecedores', iconName: 'Users' },
    { icon: ShoppingCart, label: 'Compras', href: '/compras', iconName: 'ShoppingCart' },
    { icon: Warehouse, label: 'Estoque', href: '/estoque', iconName: 'Warehouse' },
    { icon: Package, label: 'Pedidos', href: '/pedidos', iconName: 'Package' },
    { icon: Box, label: 'Produção', href: '/producao', iconName: 'Box' },
    { icon: Box, label: 'Embalagem', href: '/embalagem', iconName: 'Box' },
    { icon: DollarSign, label: 'Vendas', href: '/vendas', iconName: 'DollarSign' },
    { icon: FilePen, label: 'Emissão Fiscal', href: '/emissao-fiscal', iconName: 'FilePen' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro', iconName: 'DollarSign' },
    { icon: Truck, label: 'Rotas', href: '/rotas', iconName: 'Truck' },
    { icon: Calendar, label: 'Calendário', href: '/calendario', iconName: 'Calendar' },
    { icon: FilePen, label: 'Ordens de Serviço', href: '/ordens-servico', iconName: 'FilePen' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes', iconName: 'Settings' }
  ];

  // Filtrar itens do menu baseado nas permissões
  const getFilteredMenuItems = () => {
    // Master e Admin veem tudo
    if (userRole === 'master' || userRole === 'admin') {
      return menuItems;
    }
    
    // Se ainda está carregando, mostrar pelo menos o dashboard
    if (loading) {
      return menuItems.filter(item => item.href === '/');
    }
    
    // Para outros usuários, verificar permissões
    const allowedRoutes = getAllowedRoutes();
    return menuItems.filter(item => {
      // Dashboard sempre visível
      if (item.href === '/') return true;
      
      // Verificar se tem permissão para a rota
      return allowedRoutes.includes(item.href);
    });
  };

  const filteredMenuItems = getFilteredMenuItems();

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

      <nav className="flex-1 p-4 space-y-1">
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
      {/* Mobile menu button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
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
