import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/components/Auth/AuthProvider';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { RequireCompany } from '@/components/Auth/RequireCompany';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Layout } from '@/components/Layout';
import { SaasLayout } from '@/components/Saas/SaasLayout';

// Auth Pages
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import AcceptInvitePage from './AcceptInvitePage';

// SaaS Pages
import SaasHomePage from './SaasHomePage';
import CompaniesPage from './CompaniesPage';
import CompanySettingsPage from './CompanySettingsPage';
import SaasSettingsPage from './SaasSettingsPage';

// App Pages
import DashboardPage from './DashboardPage';
import ProductsPage from './ProductsPage';
import ProductFormPage from './ProductFormPage';
import ClientsPage from './ClientsPage';
import ClientFormPage from './ClientFormPage';
import OrdersPage from './OrdersPage';
import OrderFormPage from './OrderFormPage';
import ProductionPage from './ProductionPage';
import PackagingPage from './PackagingPage';
import SalesPage from './SalesPage';
import RoutesPage from './RoutesPage';
import SettingsPage from './SettingsPage';
import VendorsPage from './VendorsPage';
import CommissionsPage from './CommissionsPage';

export default function Index() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="erp-theme">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* SaaS Routes */}
            <Route path="/saas" element={<RequireAuth><SaasLayout /></RequireAuth>}>
              <Route index element={<SaasHomePage />} />
              <Route path="empresas" element={<CompaniesPage />} />
              <Route path="empresas/:id/configuracoes" element={<CompanySettingsPage />} />
              <Route path="configuracoes" element={<SaasSettingsPage />} />
            </Route>

            {/* App Routes */}
            <Route path="/" element={<RequireAuth><RequireCompany><Layout /></RequireCompany></RequireAuth>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="produtos" element={<ProductsPage />} />
              <Route path="produtos/:id" element={<ProductFormPage />} />
              <Route path="clientes" element={<ClientsPage />} />
              <Route path="clientes/:id" element={<ClientFormPage />} />
              <Route path="pedidos" element={<OrdersPage />} />
              <Route path="pedidos/:id" element={<OrderFormPage />} />
              <Route path="producao" element={<ProductionPage />} />
              <Route path="embalagem" element={<PackagingPage />} />
              <Route path="vendas" element={<SalesPage />} />
              <Route path="rotas" element={<RoutesPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="fornecedores" element={<VendorsPage />} />
              <Route path="/comissoes" element={<CommissionsPage />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
