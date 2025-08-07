import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings, AlertTriangle } from 'lucide-react';
import { useNotaFiscalConfig } from '@/hooks/useNotaFiscalConfig';

// DEPRECADO: Este componente foi substituído pela página de configurações fiscais centralizadas
// As configurações agora estão em Configurações > Informações Fiscais da Empresa

const NotaFiscalConfig = () => {
  const { config, loading, saving, saveConfig, setConfig } = useNotaFiscalConfig();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config) {
      saveConfig(config);
    }
  };

  const updateConfig = (field: string, value: any) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Configurações Migradas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">⚠️ Página Descontinuada</h4>
          <p className="text-sm text-orange-800 mb-4">
            As configurações de nota fiscal foram centralizadas na página principal de configurações fiscais.
          </p>
          <p className="text-sm text-orange-700">
            Acesse: <strong>Configurações → Informações Fiscais da Empresa</strong> para gerenciar todas as configurações fiscais em um só local.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotaFiscalConfig;