
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import OrdersPage from "./pages/OrdersPage";
import OrderFormPage from "./pages/OrderFormPage";
import ProductsPage from "./pages/ProductsPage";
import ClientsPage from "./pages/ClientsPage";
import ProductionPage from "./pages/ProductionPage";
import PackagingPage from "./pages/PackagingPage";
import SalesPage from "./pages/SalesPage";
import FinancePage from "./pages/FinancePage";
import RoutesPage from "./pages/RoutesPage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import VendorsPage from "./pages/VendorsPage";
import PurchasesPage from "./pages/PurchasesPage";
import StockPage from "./pages/StockPage";
import FiscalEmissionPage from "./pages/FiscalEmissionPage";
import ServiceOrdersPage from "./pages/ServiceOrdersPage";
import NotFound from "./pages/NotFound";
import { FinancialProvider } from "./contexts/FinancialContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FinancialProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/pedidos" element={<OrdersPage />} />
                          <Route path="/pedidos/novo" element={<OrderFormPage />} />
                          <Route path="/produtos" element={<ProductsPage />} />
                          <Route path="/clientes" element={<ClientsPage />} />
                          <Route path="/producao" element={<ProductionPage />} />
                          <Route path="/embalagem" element={<PackagingPage />} />
                          <Route path="/vendas" element={<SalesPage />} />
                          <Route path="/financeiro" element={<FinancePage />} />
                          <Route path="/rotas" element={<RoutesPage />} />
                          <Route path="/calendario" element={<CalendarPage />} />
                          <Route path="/configuracoes" element={<SettingsPage />} />
                          <Route path="/fornecedores" element={<VendorsPage />} />
                          <Route path="/compras" element={<PurchasesPage />} />
                          <Route path="/estoque" element={<StockPage />} />
                          <Route path="/emissao-fiscal" element={<FiscalEmissionPage />} />
                          <Route path="/ordens-servico" element={<ServiceOrdersPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </FinancialProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
