import { Routes, Route, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ProductCatalog } from "@/components/Ecommerce/ProductCatalog";
import { ProductDetails } from "@/components/Ecommerce/ProductDetails";
import { Cart } from "@/components/Ecommerce/Cart";
import { Checkout } from "@/components/Ecommerce/Checkout";
import { OrderSuccess } from "@/components/Ecommerce/OrderSuccess";
import { OrderSuccessPage } from "./OrderSuccessPage";
import { EcommerceLayout } from "@/components/Ecommerce/EcommerceLayout";
import { CompanyProvider, useCompanyStore } from "@/contexts/CompanyProvider";

function EcommerceContent() {
  const { companyCode } = useParams<{ companyCode: string }>();
  const { loadCompanyByCode, loadCompanyByDomain, loading, error, company, ecommerceSettings } = useCompanyStore();
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!companyCode || loading || loadedRef.current === companyCode) {
      return;
    }

    loadedRef.current = companyCode;

    // Verificar se é um domínio personalizado ou código da empresa
    const isCustomDomain = window.location.hostname !== 'localhost' && 
                          !window.location.hostname.includes('lovable.app') &&
                          !window.location.hostname.includes('sandbox.lovable.dev');
    
    if (isCustomDomain) {
      // Se for domínio personalizado, buscar pela URL
      loadCompanyByDomain(window.location.hostname);
    } else {
      // Se for código da empresa, buscar pelo código
      loadCompanyByCode(companyCode);
    }
  }, [companyCode, loading, loadCompanyByCode, loadCompanyByDomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando loja...</p>
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
        <Route path="/pedido/:orderId" element={<OrderSuccessPage />} />
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