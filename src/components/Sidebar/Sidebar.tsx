
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
  FilePen
} from 'lucide-react';
import { cn } from "@/lib/utils";

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
  
  const navigationItems = [
    { path: "/", text: "Dashboard", icon: ChartBar },
    { path: "/clientes", text: "Clientes", icon: User },
    { path: "/produtos", text: "Produtos", icon: Package },
    { path: "/fornecedores", text: "Fornecedores", icon: Users },
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

  return (
    <aside className={`bg-background border-r border-border h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-xl font-bold text-primary">
            ERP System
          </h2>
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
      <div className="p-2">
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
    </aside>
  );
};
