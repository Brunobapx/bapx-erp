import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, FileText, Percent, Save } from 'lucide-react';
import { useCompanyFiscalSettings } from '@/hooks/useCompanyFiscalSettings';

export const CompanyFiscalInfo = () => {
  const { settings, setSettings, loading, saving, saveSettings, getTaxInfo } = useCompanyFiscalSettings();
  const taxInfo = getTaxInfo();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Informações fiscais da ARTISAN BREAD baseadas na NF-e anterior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Razão Social</Label>
              <Input value={settings.company_name} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Nome Fantasia</Label>
              <Input value={settings.company_fantasy_name} disabled className="bg-muted" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={settings.company_cnpj} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Inscrição Estadual</Label>
              <Input value={settings.company_ie} disabled className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input value={settings.company_city} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={settings.company_state} disabled className="bg-muted" />
            </div>
          </div>

          {/* Campos editáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_address">Logradouro *</Label>
              <Input
                id="company_address"
                value={settings.company_address}
                onChange={(e) => setSettings(prev => ({ ...prev, company_address: e.target.value }))}
                placeholder="Ex: Rua das Flores"
              />
            </div>
            <div>
              <Label htmlFor="company_number">Número *</Label>
              <Input
                id="company_number"
                value={settings.company_number}
                onChange={(e) => setSettings(prev => ({ ...prev, company_number: e.target.value }))}
                placeholder="Ex: 123"
              />
            </div>
            <div>
              <Label htmlFor="company_neighborhood">Bairro *</Label>
              <Input
                id="company_neighborhood"
                value={settings.company_neighborhood}
                onChange={(e) => setSettings(prev => ({ ...prev, company_neighborhood: e.target.value }))}
                placeholder="Ex: Centro"
              />
            </div>
            <div>
              <Label htmlFor="company_cep">CEP *</Label>
              <Input
                id="company_cep"
                value={settings.company_cep}
                onChange={(e) => setSettings(prev => ({ ...prev, company_cep: e.target.value }))}
                placeholder="Ex: 20000-000"
              />
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Endereço'}
          </Button>
        </CardContent>
      </Card>

      {/* Configurações Tributárias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configurações Tributárias
          </CardTitle>
          <CardDescription>
            Configurações baseadas na análise da NF-e anterior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Regime Tributário</Label>
              <div className="flex items-center gap-2">
                <Input value={taxInfo.regime_description} disabled className="bg-muted" />
                <Badge variant="secondary">{settings.tax_regime === 3 ? 'Normal' : 'Simples'}</Badge>
              </div>
            </div>
            <div>
              <Label>CFOP Padrão</Label>
              <div className="flex items-center gap-2">
                <Input value={settings.default_cfop} disabled className="bg-muted" />
                <Badge variant="outline">ST</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{taxInfo.cfop_description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ICMS (CST)</Label>
              <div className="flex items-center gap-2">
                <Input value={settings.icms_cst} disabled className="bg-muted" />
                <Badge variant="destructive">ST</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{taxInfo.icms_description}</p>
            </div>
            <div>
              <Label>PIS (CST)</Label>
              <div className="flex items-center gap-2">
                <Input value={`${settings.pis_cst} (${settings.pis_aliquota}%)`} disabled className="bg-muted" />
                <Badge variant="secondary">Cum.</Badge>
              </div>
            </div>
            <div>
              <Label>COFINS (CST)</Label>
              <div className="flex items-center gap-2">
                <Input value={`${settings.cofins_cst} (${settings.cofins_aliquota}%)`} disabled className="bg-muted" />
                <Badge variant="secondary">Cum.</Badge>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4" />
              <span className="font-medium">Resumo Tributário</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{taxInfo.pis_cofins_description}</p>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Carga Tributária Total: {taxInfo.total_tax_rate.toFixed(2)}%
              </Badge>
              <Badge variant="secondary">
                NCM Padrão: {settings.default_ncm}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informações Importantes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• As configurações tributárias foram baseadas na análise da NF-e modelo 55 anterior</li>
          <li>• A empresa está configurada para substituição tributária (CST 60)</li>
          <li>• PIS/COFINS no regime cumulativo conforme a operação anterior</li>
          <li>• Certifique-se de que o endereço está completo antes de emitir NF-e</li>
        </ul>
      </div>
    </div>
  );
};