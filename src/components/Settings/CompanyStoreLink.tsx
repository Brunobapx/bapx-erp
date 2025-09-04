import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CompanyStoreLinkProps {
  companyCode: string;
  storeName: string;
  isActive: boolean;
  customDomain?: string;
}

export function CompanyStoreLink({ companyCode, storeName, isActive, customDomain }: CompanyStoreLinkProps) {
  const [copied, setCopied] = useState(false);
  
  const storeUrl = customDomain 
    ? `https://${customDomain}` 
    : `${window.location.origin}/loja/${companyCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const openStore = () => {
    window.open(storeUrl, '_blank');
  };

  if (!isActive) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Loja Inativa</CardTitle>
          <CardDescription>
            Ative o módulo e-commerce para gerar o link da sua loja
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          Link da Sua Loja
        </CardTitle>
        <CardDescription>
          Compartilhe este link com seus clientes para acessarem sua loja online
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted rounded-lg">
          <p className="font-mono text-sm break-all">{storeUrl}</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} variant="outline" className="flex-1">
            {copied ? (
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
          <Button onClick={openStore} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Loja
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p><strong>Dica:</strong> Você pode configurar um domínio personalizado nas configurações de e-commerce para ter um link como: https://sualoja.com.br</p>
        </div>
      </CardContent>
    </Card>
  );
}