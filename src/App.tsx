
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { ModuleProtectedRoute } from "./components/Auth/ModuleProtectedRoute";
import { Sidebar } from "./components/Sidebar/Sidebar";
import React, { Suspense, lazy } from "react";
const Index = lazy(() => import("./pages/Index"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderFormPage = lazy(() => import("./pages/OrderFormPage"));
const ProductionPage = lazy(() => import("./pages/ProductionPage"));
const PackagingPage = lazy(() => import("./pages/PackagingPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const RoutesPage = lazy(() => import("./pages/RoutesPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const PurchasesPage = lazy(() => import("./pages/PurchasesPage"));
const FiscalEmissionPage = lazy(() => import("./pages/FiscalEmissionPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const StockPage = lazy(() => import("./pages/StockPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const SaasPage = lazy(() => import("./pages/SaasPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="flex justify-center items-center h-screen">Carregando...</div>}>
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
