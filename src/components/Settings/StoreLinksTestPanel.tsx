import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy, Check, Store, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoreInfo {
  company_name: string;
  company_code: string;
  store_name: string;
  available_products: number;
  ecommerce_active: boolean;
}

export function StoreLinksTestPanel() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedStore, setCopiedStore] = useState<string | null>(null);

  useEffect(() => {
    loadActiveStores();
  }, []);

  const loadActiveStores = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          name,
          code,
          company_ecommerce_settings!inner(
            store_name,
            is_active
          ),
          products(
            id,
            is_direct_sale,
            is_active,
            stock
          )
        `)
        .eq('company_ecommerce_settings.is_active', true);

      if (error) throw error;

      const storeList = data?.map(company => ({
        company_name: company.name,
        company_code: company.code,
        store_name: company.company_ecommerce_settings[0]?.store_name || company.name,
        available_products: company.products?.filter(p => 
          p.is_direct_sale && p.is_active && p.stock > 0
        ).length || 0,
        ecommerce_active: true
      })) || [];

      setStores(storeList);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      toast.error('Erro ao carregar informações das lojas');
    } finally {
      setLoading(false);
    }
  };

  const getStoreUrl = (companyCode: string) => {
    return `${window.location.origin}/loja/${companyCode}`;
  };

  const copyToClipboard = async (storeUrl: string, companyCode: string) => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopiedStore(companyCode);
      setTimeout(() => setCopiedStore(null), 2000);
      toast.success('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast.error('Erro ao copiar link');
    }
  };

  const openStore = (storeUrl: string) => {
    window.open(storeUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Lojas Ativas
          </CardTitle>
          <CardDescription>Carregando informações das lojas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Lojas Ativas
          </CardTitle>
          <CardDescription>Nenhuma loja ativa encontrada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Ative o módulo e-commerce nas configurações da empresa para criar uma loja online.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Teste das Lojas Online
        </CardTitle>
        <CardDescription>
          Links para testar as lojas e-commerce ativas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stores.map((store) => {
          const storeUrl = getStoreUrl(store.company_code);
          const isCopied = copiedStore === store.company_code;
          
          return (
            <div key={store.company_code} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {store.store_name}
                    <Badge variant="secondary" className="text-xs">
                      Código: {store.company_code}
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {store.company_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={store.available_products > 0 ? "default" : "outline"}
                    className="flex items-center gap-1"
                  >
                    <Package className="h-3 w-3" />
                    {store.available_products} produtos
                  </Badge>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-sm break-all">{storeUrl}</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => copyToClipboard(storeUrl, store.company_code)} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => openStore(storeUrl)} 
                  size="sm"
                  className="flex-1"
                  disabled={store.available_products === 0}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {store.available_products > 0 ? 'Abrir Loja' : 'Sem Produtos'}
                </Button>
              </div>

              {store.available_products === 0 && (
                <div className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                  <p><strong>Atenção:</strong> Esta loja não possui produtos disponíveis para venda. Adicione produtos com "Venda Direta" ativada para testá-la.</p>
                </div>
              )}
            </div>
          );
        })}
        
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p><strong>Como testar:</strong></p>
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li>Clique em "Abrir Loja" para visualizar a loja no navegador</li>
            <li>Cada loja mostra apenas os produtos da sua empresa</li>
            <li>O carrinho é isolado por empresa (diferentes lojas = carrinhos separados)</li>
            <li>As cores e logos podem ser personalizadas nas configurações de e-commerce</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}