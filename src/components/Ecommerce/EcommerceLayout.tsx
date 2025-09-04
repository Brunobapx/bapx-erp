import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "./hooks/useCart";
import { useState } from "react";

interface EcommerceLayoutProps {
  children: ReactNode;
}

export function EcommerceLayout({ children }: EcommerceLayoutProps) {
  const navigate = useNavigate();
  const { items, getTotalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/loja?search=${encodeURIComponent(searchQuery.trim())}`);
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
              to="/loja" 
              className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
            >
              BAPX Store
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
                to="/loja"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Produtos
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/loja/carrinho")}
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
              onClick={() => navigate("/loja/carrinho")}
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
                  to="/loja"
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
              <h3 className="font-semibold text-foreground mb-4">BAPX Store</h3>
              <p className="text-sm text-muted-foreground">
                Sua loja de produtos de qualidade com entrega rápida e segura.
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
                contato@bapxstore.com.br
              </p>
              <p className="text-sm text-muted-foreground">
                (11) 99999-9999
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Formas de Pagamento</h4>
              <p className="text-sm text-muted-foreground">
                PIX, Cartão de Crédito, Boleto
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 BAPX Store. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}