
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { ModuleAccessCheck } from "@/components/Auth/ModuleAccessCheck";
import Sidebar from "@/components/Sidebar/Sidebar";
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
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/configuracoes" element={<SettingsPage />} />
                          
                          <Route path="/pedidos" element={
                            <ModuleAccessCheck routePath="/pedidos">
                              <OrdersPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/pedidos/novo" element={
                            <ModuleAccessCheck routePath="/pedidos">
                              <OrderFormPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/pedidos/new" element={
                            <ModuleAccessCheck routePath="/pedidos">
                              <OrderFormPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/pedidos/:id" element={
                            <ModuleAccessCheck routePath="/pedidos">
                              <OrderFormPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/produtos" element={
                            <ModuleAccessCheck routePath="/produtos">
                              <ProductsPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/clientes" element={
                            <ModuleAccessCheck routePath="/clientes">
                              <ClientsPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/producao" element={
                            <ModuleAccessCheck routePath="/producao">
                              <ProductionPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/embalagem" element={
                            <ModuleAccessCheck routePath="/embalagem">
                              <PackagingPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/vendas" element={
                            <ModuleAccessCheck routePath="/vendas">
                              <SalesPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/financeiro" element={
                            <ModuleAccessCheck routePath="/financeiro">
                              <FinancePage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/rotas" element={
                            <ModuleAccessCheck routePath="/rotas">
                              <RoutesPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/calendario" element={
                            <ModuleAccessCheck routePath="/calendario">
                              <CalendarPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/fornecedores" element={
                            <ModuleAccessCheck routePath="/fornecedores">
                              <VendorsPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/compras" element={
                            <ModuleAccessCheck routePath="/compras">
                              <PurchasesPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/estoque" element={
                            <ModuleAccessCheck routePath="/estoque">
                              <StockPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/emissao-fiscal" element={
                            <ModuleAccessCheck routePath="/emissao-fiscal">
                              <FiscalEmissionPage />
                            </ModuleAccessCheck>
                          } />
                          <Route path="/ordens-servico" element={
                            <ModuleAccessCheck routePath="/ordens-servico">
                              <ServiceOrdersPage />
                            </ModuleAccessCheck>
                          } />
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
