
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
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
                      <Route path="/clientes" element={<ClientsPage />} />
                      <Route path="/produtos" element={<ProductsPage />} />
                      <Route path="/fornecedores" element={<VendorsPage />} />
                      <Route path="/compras" element={<PurchasesPage />} />
                      <Route path="/pedidos" element={<OrdersPage />} />
                      <Route path="/pedidos/:id" element={<OrderFormPage />} />
                      <Route path="/producao" element={<ProductionPage />} />
                      <Route path="/embalagem" element={<PackagingPage />} />
                      <Route path="/vendas" element={<SalesPage />} />
                      <Route path="/emissao-fiscal" element={<FiscalEmissionPage />} />
                      <Route path="/financeiro" element={<FinancePage />} />
                      <Route path="/rotas" element={<RoutesPage />} />
                      <Route path="/calendario" element={<CalendarPage />} />
                      <Route path="/estoque" element={<StockPage />} />
                      <Route path="/configuracoes" element={<SettingsPage />} />
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
