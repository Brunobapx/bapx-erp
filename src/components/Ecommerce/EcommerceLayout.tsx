import { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, Search, Menu, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "./hooks/useCart";
import { useCompanyStore } from "@/contexts/CompanyProvider";
import { useState } from "react";

interface EcommerceLayoutProps {
  children: ReactNode;
}

export function EcommerceLayout({ children }: EcommerceLayoutProps) {
  const navigate = useNavigate();
  const { companyCode } = useParams<{ companyCode: string }>();
  const { items, getTotalItems } = useCart();
  const { company, ecommerceSettings } = useCompanyStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && companyCode) {
      navigate(`/loja/${companyCode}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link 
              to={`/loja/${companyCode}`} 
              className="flex items-center space-x-3"
            >
              {ecommerceSettings?.store_logo_url ? (
                <img 
                  src={ecommerceSettings.store_logo_url} 
                  alt={ecommerceSettings.store_name}
                  className="h-10 w-10 object-contain rounded-lg"
                />
              ) : (
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              )}
              <span className="text-xl font-bold text-foreground">
                {ecommerceSettings?.store_name || company?.name || 'Loja'}
              </span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link 
                to={`/loja/${companyCode}`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Produtos
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/loja/${companyCode}/carrinho`)}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs"
                  >
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Cart Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/loja/${companyCode}/carrinho`)}
              className="relative md:hidden"
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs"
                >
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col gap-2">
                <Link 
                  to={`/loja/${companyCode}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Produtos
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">
                {ecommerceSettings?.store_name || company?.name || 'Loja'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {ecommerceSettings?.store_description || 'Sua loja de produtos de qualidade com entrega rápida e segura.'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Atendimento</h4>
              <p className="text-sm text-muted-foreground mb-1">
                Segunda à Sexta: 8h às 18h
              </p>
              <p className="text-sm text-muted-foreground">
                Sábado: 8h às 12h
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Contato</h4>
              <p className="text-sm text-muted-foreground mb-1">
                {company?.email || 'contato@loja.com.br'}
              </p>
              <p className="text-sm text-muted-foreground">
                {company?.telefone || company?.whatsapp || '(11) 99999-9999'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Formas de Pagamento</h4>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const paymentMethods = ecommerceSettings?.payment_methods;
                  if (Array.isArray(paymentMethods)) {
                    return paymentMethods.join(', ');
                  } else if (typeof paymentMethods === 'string') {
                    try {
                      const parsed = JSON.parse(paymentMethods);
                      return Array.isArray(parsed) ? parsed.join(', ') : 'PIX, Cartão de Crédito, Boleto';
                    } catch {
                      return 'PIX, Cartão de Crédito, Boleto';
                    }
                  }
                  return 'PIX, Cartão de Crédito, Boleto';
                })()}
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 {ecommerceSettings?.store_name || company?.name || 'Loja'}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}