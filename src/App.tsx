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
import TrocasPage from "./pages/TrocasPage";
import ProductsPage from "./pages/ProductsPage";
import ProductFormPage from "./pages/ProductFormPage";
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
import NotaFiscalPage from "./pages/NotaFiscalPage";
import ServiceOrdersPage from "./pages/ServiceOrdersPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";
import SimpleOrderFormPage from "./pages/SimpleOrderFormPage";
import QuotePage from "./pages/QuotePage";
import { FinancialProvider } from "./contexts/FinancialContext";
import SaaSPage from "./pages/SaaSPage";

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
              
              <Route path="/" element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 overflow-auto lg:ml-64">
                      <Index />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/trocas" element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 overflow-auto lg:ml-64">
                      <TrocasPage />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/orcamentos" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/orcamentos">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <QuotePage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/pedidos" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/pedidos">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <OrdersPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/pedidos/new" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/pedidos">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <SimpleOrderFormPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/pedidos/edit/:id" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/pedidos">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <SimpleOrderFormPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/produtos" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/produtos">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <ProductsPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/produtos/new" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/produtos">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <ProductFormPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/produtos/edit/:id" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/produtos">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <ProductFormPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/clientes">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <ClientsPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/producao" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/producao">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <ProductionPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/embalagem" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/embalagem">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <PackagingPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/vendas" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/vendas">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <SalesPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/financeiro" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/financeiro">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <FinancePage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/rotas" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/rotas">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <RoutesPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/calendario" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/calendario">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <CalendarPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/fornecedores" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/fornecedores">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <VendorsPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/compras" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/compras">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <PurchasesPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/estoque" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/estoque">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <StockPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/nota-fiscal" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/nota-fiscal">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <NotaFiscalPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/ordens-servico" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/ordens-servico">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <ServiceOrdersPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <ModuleAccessCheck routePath="/relatorios">
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-auto lg:ml-64">
                        <ReportsPage />
                      </main>
                    </div>
                  </ModuleAccessCheck>
                </ProtectedRoute>
              } />
              
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 overflow-auto lg:ml-64">
                      <SettingsPage />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/saas" element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 overflow-auto lg:ml-64">
                      <SaaSPage />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FinancialProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;