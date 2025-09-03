import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChartBar, Users, Package, ShoppingCart, DollarSign, 
  Truck, Calendar, Settings, FileText, Box, Warehouse,
  FilePen, LogOut, Menu, X, BarChart3, Building2, Calculator
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { useCompanyBranding } from '@/hooks/useCompanyBranding';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const { hasAccess, loading: accessLoading } = useModuleAccess();
  const { branding } = useCompanyBranding();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: ChartBar, label: 'Dashboard', href: '/', route: '/' },
    { icon: Users, label: 'Clientes', href: '/clientes', route: '/clientes' },
    { icon: Package, label: 'Produtos', href: '/produtos', route: '/produtos' },
    { icon: Users, label: 'Fornecedores', href: '/fornecedores', route: '/fornecedores' },
    { icon: ShoppingCart, label: 'Compras', href: '/compras', route: '/compras' },
    { icon: Warehouse, label: 'Estoque', href: '/estoque', route: '/estoque' },
    { icon: Calculator, label: 'Orçamentos', href: '/orcamentos', route: '/orcamentos' },
    { icon: Package, label: 'Pedidos', href: '/pedidos', route: '/pedidos' },
    { icon: Box, label: 'Produção', href: '/producao', route: '/producao' },
    { icon: Box, label: 'Embalagem', href: '/embalagem', route: '/embalagem' },
    { icon: DollarSign, label: 'Vendas', href: '/vendas', route: '/vendas' },
    { icon: FileText, label: 'Nota Fiscal', href: '/nota-fiscal', route: '/nota-fiscal' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro', route: '/financeiro' },
    { icon: FileText, label: 'Trocas', href: '/trocas', route: '/trocas' },
    { icon: Truck, label: 'Rotas', href: '/rotas', route: '/rotas' },
    { icon: Calendar, label: 'Calendário', href: '/calendario', route: '/calendario' },
    { icon: FilePen, label: 'Ordens de Serviço', href: '/ordens-servico', route: '/ordens-servico' },
    { icon: BarChart3, label: 'Relatórios', href: '/relatorios', route: '/relatorios' },
    { icon: Building2, label: 'SaaS', href: '/saas', route: '/saas' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes', route: '/configuracoes' }
  ];

  // Filtrar itens baseado nas permissões do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // A página SaaS é exclusiva para MASTER
    if (item.route === '/saas') {
      return userRole === 'master';
    }

    // Admin e Master veem todos os demais itens
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
      <div className="p-6 border-b border-border menu-bg">
        <div className="flex items-center gap-3">
          <img
            src={branding?.logo_url || "/lovable-uploads/a627e39d-287e-4e8b-96f3-d8c8f7b7d997.png"}
            alt={branding?.name || "BAPX ERP"}
            className="w-10 h-10 rounded-lg object-contain"
            width="40"
            height="40"
            loading="lazy"
          />
          <div>
            <h1 className="text-xl font-bold menu-text">{branding?.name || "BAPX ERP"}</h1>
            <p className="text-sm menu-text opacity-75">Gestão Empresarial</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto menu-bg">
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
                  ? 'menu-hover menu-text'
                  : 'menu-text hover:menu-hover opacity-80 hover:opacity-100'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border menu-bg">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 menu-text"
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

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 menu-bg border-r border-border">
        <SidebarContent />
      </aside>

      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 menu-bg border-r border-border flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
