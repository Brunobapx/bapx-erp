import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings } from 'lucide-react';
import { useNotaFiscalConfig } from '@/hooks/useNotaFiscalConfig';

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
          <Settings className="h-5 w-5" />
          Configurações de Nota Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_nota">Tipo de Nota</Label>
              <Select
                value={config?.tipo_nota || 'nfe'}
                onValueChange={(value) => updateConfig('tipo_nota', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nfe">NFe - Nota Fiscal Eletrônica</SelectItem>
                  <SelectItem value="nfce">NFCe - Nota Fiscal de Consumidor</SelectItem>
                  <SelectItem value="nfse">NFSe - Nota Fiscal de Serviços</SelectItem>
                  <SelectItem value="cte">CTe - Conhecimento de Transporte</SelectItem>
                  <SelectItem value="mdfe">MDFe - Manifesto de Documentos Fiscais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambiente">Ambiente</Label>
              <Select
                value={config?.ambiente || 'homologacao'}
                onValueChange={(value) => updateConfig('ambiente', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token_focus">Token Focus NFe</Label>
              <Input
                id="token_focus"
                type="password"
                value={config?.token_focus || ''}
                onChange={(e) => updateConfig('token_focus', e.target.value)}
                placeholder="Seu token da API Focus NFe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj_emissor">CNPJ Emissor</Label>
              <Input
                id="cnpj_emissor"
                value={config?.cnpj_emissor || ''}
                onChange={(e) => updateConfig('cnpj_emissor', e.target.value)}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regime_tributario">Regime Tributário</Label>
              <Select
                value={config?.regime_tributario || '1'}
                onValueChange={(value) => updateConfig('regime_tributario', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Simples Nacional</SelectItem>
                  <SelectItem value="2">Simples Nacional - Excesso</SelectItem>
                  <SelectItem value="3">Regime Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_empresa">Tipo de Empresa</Label>
              <Select
                value={config?.tipo_empresa || 'MEI'}
                onValueChange={(value) => updateConfig('tipo_empresa', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="ME">Microempresa</SelectItem>
                  <SelectItem value="EPP">Empresa de Pequeno Porte</SelectItem>
                  <SelectItem value="LTDA">Sociedade Limitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfop_padrao">CFOP Padrão</Label>
              <Input
                id="cfop_padrao"
                value={config?.cfop_padrao || '5101'}
                onChange={(e) => updateConfig('cfop_padrao', e.target.value)}
                placeholder="5101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csosn_padrao">CSOSN Padrão</Label>
              <Input
                id="csosn_padrao"
                value={config?.csosn_padrao || '101'}
                onChange={(e) => updateConfig('csosn_padrao', e.target.value)}
                placeholder="101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cst_padrao">CST Padrão</Label>
              <Input
                id="cst_padrao"
                value={config?.cst_padrao || '00'}
                onChange={(e) => updateConfig('cst_padrao', e.target.value)}
                placeholder="00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icms_percentual">ICMS (%)</Label>
              <Input
                id="icms_percentual"
                type="number"
                step="0.01"
                value={config?.icms_percentual || 18}
                onChange={(e) => updateConfig('icms_percentual', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pis_percentual">PIS (%)</Label>
              <Input
                id="pis_percentual"
                type="number"
                step="0.01"
                value={config?.pis_percentual || 1.65}
                onChange={(e) => updateConfig('pis_percentual', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cofins_percentual">COFINS (%)</Label>
              <Input
                id="cofins_percentual"
                type="number"
                step="0.01"
                value={config?.cofins_percentual || 7.6}
                onChange={(e) => updateConfig('cofins_percentual', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotaFiscalConfig;