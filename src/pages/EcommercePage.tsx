import { Routes, Route, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ProductCatalog } from "@/components/Ecommerce/ProductCatalog";
import { ProductDetails } from "@/components/Ecommerce/ProductDetails";
import { Cart } from "@/components/Ecommerce/Cart";
import { Checkout } from "@/components/Ecommerce/Checkout";
import { OrderSuccess } from "@/components/Ecommerce/OrderSuccess";
import { EcommerceLayout } from "@/components/Ecommerce/EcommerceLayout";
import { CompanyProvider, useCompanyStore } from "@/contexts/CompanyProvider";

function EcommerceContent() {
  console.log('EcommerceContent: Component initializing');
  const { companyCode } = useParams<{ companyCode: string }>();
  const { loadCompanyByCode, loadCompanyByDomain, loading, error, company, ecommerceSettings } = useCompanyStore();

  useEffect(() => {
    console.log('EcommerceContent - useEffect', { companyCode, currentURL: window.location.href });
    if (companyCode) {
      // Verificar se é um domínio personalizado ou código da empresa
      const isCustomDomain = window.location.hostname !== 'localhost' && 
                            !window.location.hostname.includes('lovable.app') &&
                            !window.location.hostname.includes('sandbox.lovable.dev');
      
      console.log('Loading company...', { companyCode, isCustomDomain, hostname: window.location.hostname });
      
      if (isCustomDomain) {
        // Se for domínio personalizado, buscar pela URL
        loadCompanyByDomain(window.location.hostname);
      } else {
        // Se for código da empresa, buscar pelo código
        loadCompanyByCode(companyCode);
      }
    }
  }, [companyCode, loadCompanyByCode, loadCompanyByDomain]);

  // Debug logs
  console.log('EcommerceContent render', { loading, error, company, ecommerceSettings, companyCode });
  console.log('EcommerceContent render conditions:', {
    isLoading: loading,
    hasError: !!error,
    hasCompany: !!company,
    hasEcommerceSettings: !!ecommerceSettings,
    willShowLoading: loading,
    willShowError: !!error,
    willShowIncomplete: !company || !ecommerceSettings,
    willShowContent: !loading && !error && company && ecommerceSettings
  });

  if (loading) {
    console.log('EcommerceContent: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando loja...</p>
          <p className="text-xs text-muted-foreground">Código: {companyCode}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">Código tentado: {companyCode}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!company || !ecommerceSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold">Configuração incompleta</h1>
          <p className="text-muted-foreground">
            Company: {company ? '✅' : '❌'} | 
            E-commerce: {ecommerceSettings ? '✅' : '❌'}
          </p>
          <p className="text-xs">Código: {companyCode}</p>
        </div>
      </div>
    );
  }

  return (
    <EcommerceLayout>
      <Routes>
        <Route path="/" element={<ProductCatalog />} />
        <Route path="/produto/:id" element={<ProductDetails />} />
        <Route path="/carrinho" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido/:id" element={<OrderSuccess />} />
      </Routes>
    </EcommerceLayout>
  );
}

export function EcommercePage() {
  return (
    <CompanyProvider>
      <EcommerceContent />
    </CompanyProvider>
  );
}