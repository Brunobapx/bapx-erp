
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import OrdersPage from "./pages/OrdersPage";
import ProductionPage from "./pages/ProductionPage";
import PackagingPage from "./pages/PackagingPage";
import SalesPage from "./pages/SalesPage";
import FinancePage from "./pages/FinancePage";
import RoutesPage from "./pages/RoutesPage";
import CalendarPage from "./pages/CalendarPage";
import ClientsPage from "./pages/ClientsPage";
import ProductsPage from "./pages/ProductsPage";
import VendorsPage from "./pages/VendorsPage";
import FiscalEmissionPage from "./pages/FiscalEmissionPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <Index />
                    </div>
                  </div>
                } />
                
                <Route path="/clientes" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <ClientsPage />
                    </div>
                  </div>
                } />
                
                <Route path="/produtos" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <ProductsPage />
                    </div>
                  </div>
                } />
                
                <Route path="/fornecedores" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <VendorsPage />
                    </div>
                  </div>
                } />
                
                <Route path="/pedidos" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <OrdersPage />
                    </div>
                  </div>
                } />
                
                <Route path="/producao" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <ProductionPage />
                    </div>
                  </div>
                } />
                
                <Route path="/embalagem" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <PackagingPage />
                    </div>
                  </div>
                } />
                
                <Route path="/vendas" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <SalesPage />
                    </div>
                  </div>
                } />
                
                <Route path="/emissao-fiscal" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <FiscalEmissionPage />
                    </div>
                  </div>
                } />
                
                <Route path="/financeiro" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <FinancePage />
                    </div>
                  </div>
                } />
                
                <Route path="/rotas" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <RoutesPage />
                    </div>
                  </div>
                } />
                
                <Route path="/calendario" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <CalendarPage />
                    </div>
                  </div>
                } />
                
                <Route path="/configuracoes" element={
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <SettingsPage />
                    </div>
                  </div>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
