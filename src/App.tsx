
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { ModuleProtectedRoute } from "./components/Auth/ModuleProtectedRoute";
import { Sidebar } from "./components/Sidebar/Sidebar";
import Index from "./pages/Index";
import OrdersPage from "./pages/OrdersPage";
import OrderFormPage from "./pages/OrderFormPage";
import ProductionPage from "./pages/ProductionPage";
import PackagingPage from "./pages/PackagingPage";
import SalesPage from "./pages/SalesPage";
import FinancePage from "./pages/FinancePage";
import RoutesPage from "./pages/RoutesPage";
import CalendarPage from "./pages/CalendarPage";
import ClientsPage from "./pages/ClientsPage";
import ProductsPage from "./pages/ProductsPage";
import VendorsPage from "./pages/VendorsPage";
import PurchasesPage from "./pages/PurchasesPage";
import FiscalEmissionPage from "./pages/FiscalEmissionPage";
import SettingsPage from "./pages/SettingsPage";
import StockPage from "./pages/StockPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import SaasPage from "./pages/SaasPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="flex h-screen overflow-hidden">
                  <Sidebar />
                  <div className="flex-1 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/saas" element={<SaasPage />} />
                      <Route path="/clientes" element={<ModuleProtectedRoute requiredRoute="/clientes"><ClientsPage /></ModuleProtectedRoute>} />
                      <Route path="/produtos" element={<ModuleProtectedRoute requiredRoute="/produtos"><ProductsPage /></ModuleProtectedRoute>} />
                      <Route path="/fornecedores" element={<ModuleProtectedRoute requiredRoute="/fornecedores"><VendorsPage /></ModuleProtectedRoute>} />
                      <Route path="/compras" element={<ModuleProtectedRoute requiredRoute="/compras"><PurchasesPage /></ModuleProtectedRoute>} />
                      <Route path="/pedidos" element={<ModuleProtectedRoute requiredRoute="/pedidos"><OrdersPage /></ModuleProtectedRoute>} />
                      <Route path="/pedidos/:id" element={<ModuleProtectedRoute requiredRoute="/pedidos"><OrderFormPage /></ModuleProtectedRoute>} />
                      <Route path="/producao" element={<ModuleProtectedRoute requiredRoute="/producao"><ProductionPage /></ModuleProtectedRoute>} />
                      <Route path="/embalagem" element={<ModuleProtectedRoute requiredRoute="/embalagem"><PackagingPage /></ModuleProtectedRoute>} />
                      <Route path="/vendas" element={<ModuleProtectedRoute requiredRoute="/vendas"><SalesPage /></ModuleProtectedRoute>} />
                      <Route path="/emissao-fiscal" element={<ModuleProtectedRoute requiredRoute="/emissao-fiscal"><FiscalEmissionPage /></ModuleProtectedRoute>} />
                      <Route path="/financeiro" element={<ModuleProtectedRoute requiredRoute="/financeiro"><FinancePage /></ModuleProtectedRoute>} />
                      <Route path="/rotas" element={<ModuleProtectedRoute requiredRoute="/rotas"><RoutesPage /></ModuleProtectedRoute>} />
                      <Route path="/calendario" element={<ModuleProtectedRoute requiredRoute="/calendario"><CalendarPage /></ModuleProtectedRoute>} />
                      <Route path="/estoque" element={<ModuleProtectedRoute requiredRoute="/estoque"><StockPage /></ModuleProtectedRoute>} />
                      <Route path="/configuracoes" element={<ModuleProtectedRoute requiredRoute="/configuracoes"><SettingsPage /></ModuleProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
