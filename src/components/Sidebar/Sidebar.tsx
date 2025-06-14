
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Box, 
  Truck, 
  DollarSign, 
  Route, 
  Settings, 
  ChartBar,
  Calendar,
  User,
  Users,
  FilePen,
  Warehouse,
  ShoppingCart,
  Building2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { UserSection } from './UserSection';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';

const SidebarLink = ({ 
  to, 
  icon: Icon, 
  text, 
  isActive 
}: { 
  to: string; 
  icon: React.ElementType; 
  text: string; 
  isActive: boolean;
}) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent/50",
        isActive ? "bg-accent/50 font-medium text-accent-foreground" : "text-muted-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{text}</span>
    </Link>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const { userRole } = useAuth();
  const { allowedRoutes } = useModuleAccess();
  
  const allNavigationItems = [
    { path: "/", text: "Dashboard", icon: ChartBar },
    ...(userRole === 'master' ? [{ path: "/saas", text: "SaaS", icon: Building2 }] : []),
    { path: "/clientes", text: "Clientes", icon: User },
    { path: "/produtos", text: "Produtos", icon: Package },
    { path: "/fornecedores", text: "Fornecedores", icon: Users },
    { path: "/compras", text: "Compras", icon: ShoppingCart },
    { path: "/estoque", text: "Estoque", icon: Warehouse },
    { path: "/pedidos", text: "Pedidos", icon: Package },
    { path: "/producao", text: "Produção", icon: Box },
    { path: "/embalagem", text: "Embalagem", icon: Box },
    { path: "/vendas", text: "Vendas", icon: DollarSign },
    { path: "/emissao-fiscal", text: "Emissão Fiscal", icon: FilePen },
    { path: "/financeiro", text: "Financeiro", icon: DollarSign },
    { path: "/rotas", text: "Roteirização", icon: Truck },
    { path: "/calendario", text: "Calendário", icon: Calendar },
    { path: "/configuracoes", text: "Configurações", icon: Settings },
  ];

  const navigationItems = React.useMemo(() => {
    return allNavigationItems.filter(item => {
      // O Dashboard (/) é sempre visível.
      if (item.path === '/') return true;
      // A página SaaS é visível apenas para o 'master'.
      if (item.path === '/saas') return userRole === 'master';
      // Os outros itens dependem das permissões do plano.
      return allowedRoutes.includes(item.path);
    });
  }, [allowedRoutes, userRole]);

  return (
    <aside className={`bg-background border-r border-border h-screen transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/a627e39d-287e-4e8b-96f3-d8c8f7b7d997.png"
              alt="BAPX ERP Logo"
              className="w-10 h-10 object-contain bg-white rounded shadow"
              style={{ background: '#eaf7fb' }}
            />
            <h2 className="text-xl font-bold text-primary ml-1">
              BAPX ERP
            </h2>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1 hover:bg-accent/50 text-muted-foreground"
        >
          {collapsed ? 
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"></path>
            </svg> : 
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          }
        </button>
      </div>
      <div className="p-2 flex-1">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              text={collapsed ? "" : item.text}
              isActive={location.pathname === item.path}
            />
          ))}
        </nav>
      </div>
      {!collapsed && <UserSection />}
    </aside>
  );
};
