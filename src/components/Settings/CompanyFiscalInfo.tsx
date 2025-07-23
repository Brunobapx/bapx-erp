import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, FileText, Percent, Save, Settings } from 'lucide-react';
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
              <Label htmlFor="company_name">Razão Social *</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Ex: ARTISAN BREAD PAES ARTESANAIS LTDA"
              />
            </div>
            <div>
              <Label htmlFor="company_fantasy_name">Nome Fantasia *</Label>
              <Input
                id="company_fantasy_name"
                value={settings.company_fantasy_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_fantasy_name: e.target.value }))}
                placeholder="Ex: ARTISAN"
              />
            </div>
            <div>
              <Label htmlFor="company_cnpj">CNPJ *</Label>
              <Input
                id="company_cnpj"
                value={settings.company_cnpj}
                onChange={(e) => setSettings(prev => ({ ...prev, company_cnpj: e.target.value }))}
                placeholder="Ex: 39.524.018/0001-28"
              />
            </div>
            <div>
              <Label htmlFor="company_ie">Inscrição Estadual *</Label>
              <Input
                id="company_ie"
                value={settings.company_ie}
                onChange={(e) => setSettings(prev => ({ ...prev, company_ie: e.target.value }))}
                placeholder="Ex: 11867847"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_city">Cidade *</Label>
              <Input
                id="company_city"
                value={settings.company_city}
                onChange={(e) => setSettings(prev => ({ ...prev, company_city: e.target.value }))}
                placeholder="Ex: Rio de Janeiro"
              />
            </div>
            <div>
              <Label htmlFor="company_state">Estado *</Label>
              <Input
                id="company_state"
                value={settings.company_state}
                onChange={(e) => setSettings(prev => ({ ...prev, company_state: e.target.value }))}
                placeholder="Ex: RJ"
              />
            </div>
          </div>

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
              <Label htmlFor="company_complement">Complemento</Label>
              <Input
                id="company_complement"
                value={settings.company_complement}
                onChange={(e) => setSettings(prev => ({ ...prev, company_complement: e.target.value }))}
                placeholder="Ex: LOJA A, Sala 101"
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
            {saving ? 'Salvando...' : 'Salvar Dados da Empresa'}
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
              <Label htmlFor="tax_regime">Regime Tributário</Label>
              <select
                id="tax_regime"
                value={settings.tax_regime}
                onChange={(e) => setSettings(prev => ({ ...prev, tax_regime: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="1">Simples Nacional</option>
                <option value="2">Simples Nacional - Excesso</option>
                <option value="3">Regime Normal</option>
              </select>
            </div>
            <div>
              <Label htmlFor="default_cfop">CFOP Padrão</Label>
              <Input
                id="default_cfop"
                value={settings.default_cfop}
                onChange={(e) => setSettings(prev => ({ ...prev, default_cfop: e.target.value }))}
                placeholder="Ex: 5405"
              />
              <p className="text-xs text-muted-foreground mt-1">{taxInfo.cfop_description}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="default_ncm">NCM Padrão</Label>
            <Input
              id="default_ncm"
              value={settings.default_ncm}
              onChange={(e) => setSettings(prev => ({ ...prev, default_ncm: e.target.value }))}
              placeholder="Ex: 19059090"
            />
            <p className="text-xs text-muted-foreground mt-1">Código NCM padrão para produtos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="icms_cst">ICMS (CST)</Label>
              <Input
                id="icms_cst"
                value={settings.icms_cst}
                onChange={(e) => setSettings(prev => ({ ...prev, icms_cst: e.target.value }))}
                placeholder="Ex: 60"
              />
              <p className="text-xs text-muted-foreground mt-1">{taxInfo.icms_description}</p>
            </div>
            <div>
              <Label htmlFor="icms_origem">ICMS Origem</Label>
              <select
                id="icms_origem"
                value={settings.icms_origem}
                onChange={(e) => setSettings(prev => ({ ...prev, icms_origem: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="0">0 - Nacional</option>
                <option value="1">1 - Estrangeira (importação direta)</option>
                <option value="2">2 - Estrangeira (mercado interno)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pis_cst">PIS (CST)</Label>
              <Input
                id="pis_cst"
                value={settings.pis_cst}
                onChange={(e) => setSettings(prev => ({ ...prev, pis_cst: e.target.value }))}
                placeholder="Ex: 01"
              />
            </div>
            <div>
              <Label htmlFor="pis_aliquota">PIS Alíquota (%)</Label>
              <Input
                id="pis_aliquota"
                type="number"
                step="0.01"
                value={settings.pis_aliquota}
                onChange={(e) => setSettings(prev => ({ ...prev, pis_aliquota: e.target.value }))}
                placeholder="Ex: 1.65"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cofins_cst">COFINS (CST)</Label>
              <Input
                id="cofins_cst"
                value={settings.cofins_cst}
                onChange={(e) => setSettings(prev => ({ ...prev, cofins_cst: e.target.value }))}
                placeholder="Ex: 01"
              />
            </div>
            <div>
              <Label htmlFor="cofins_aliquota">COFINS Alíquota (%)</Label>
              <Input
                id="cofins_aliquota"
                type="number"
                step="0.01"
                value={settings.cofins_aliquota}
                onChange={(e) => setSettings(prev => ({ ...prev, cofins_aliquota: e.target.value }))}
                placeholder="Ex: 7.60"
              />
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações Tributárias'}
          </Button>

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

      {/* Configurações de Nota Fiscal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Nota Fiscal
          </CardTitle>
          <CardDescription>
            Configurações específicas para emissão de NFe via Focus NFe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nota_fiscal_tipo">Tipo de Nota</Label>
              <Select
                value={settings.nota_fiscal_tipo}
                onValueChange={(value) => setSettings(prev => ({ ...prev, nota_fiscal_tipo: value }))}
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
            <div>
              <Label htmlFor="nota_fiscal_ambiente">Ambiente</Label>
              <Select
                value={settings.nota_fiscal_ambiente}
                onValueChange={(value) => setSettings(prev => ({ ...prev, nota_fiscal_ambiente: value }))}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="focus_nfe_token">Token Focus NFe</Label>
              <Input
                id="focus_nfe_token"
                type="password"
                value={settings.focus_nfe_token}
                onChange={(e) => setSettings(prev => ({ ...prev, focus_nfe_token: e.target.value }))}
                placeholder="Seu token da API Focus NFe"
              />
            </div>
            <div>
              <Label htmlFor="cnpj_emissor">CNPJ Emissor</Label>
              <Input
                id="cnpj_emissor"
                value={settings.cnpj_emissor || settings.company_cnpj}
                onChange={(e) => setSettings(prev => ({ ...prev, cnpj_emissor: e.target.value }))}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa_tipo">Tipo de Empresa</Label>
              <Select
                value={settings.empresa_tipo}
                onValueChange={(value) => setSettings(prev => ({ ...prev, empresa_tipo: value }))}
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
            <div>
              <Label htmlFor="csosn_padrao">CSOSN Padrão</Label>
              <Input
                id="csosn_padrao"
                value={settings.csosn_padrao}
                onChange={(e) => setSettings(prev => ({ ...prev, csosn_padrao: e.target.value }))}
                placeholder="Ex: 101"
              />
              <p className="text-xs text-muted-foreground mt-1">Para empresas do Simples Nacional</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cst_padrao">CST Padrão</Label>
              <Input
                id="cst_padrao"
                value={settings.cst_padrao}
                onChange={(e) => setSettings(prev => ({ ...prev, cst_padrao: e.target.value }))}
                placeholder="Ex: 00"
              />
              <p className="text-xs text-muted-foreground mt-1">Para empresas do Regime Normal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="icms_percentual">ICMS (%)</Label>
              <Input
                id="icms_percentual"
                type="number"
                step="0.01"
                value={settings.icms_percentual}
                onChange={(e) => setSettings(prev => ({ ...prev, icms_percentual: e.target.value }))}
                placeholder="Ex: 18"
              />
            </div>
            <div>
              <Label htmlFor="pis_percentual">PIS (%)</Label>
              <Input
                id="pis_percentual"
                type="number"
                step="0.01"
                value={settings.pis_percentual}
                onChange={(e) => setSettings(prev => ({ ...prev, pis_percentual: e.target.value }))}
                placeholder="Ex: 1.65"
              />
            </div>
            <div>
              <Label htmlFor="cofins_percentual">COFINS (%)</Label>
              <Input
                id="cofins_percentual"
                type="number"
                step="0.01"
                value={settings.cofins_percentual}
                onChange={(e) => setSettings(prev => ({ ...prev, cofins_percentual: e.target.value }))}
                placeholder="Ex: 7.6"
              />
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações NFe'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informações Importantes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Todas as configurações fiscais agora estão centralizadas nesta página</li>
          <li>• As configurações tributárias foram baseadas na análise da NF-e modelo 55 anterior</li>
          <li>• A empresa está configurada para substituição tributária (CST 60)</li>
          <li>• PIS/COFINS no regime cumulativo conforme a operação anterior</li>
          <li>• Certifique-se de que o endereço está completo antes de emitir NF-e</li>
          <li>• Configure o token Focus NFe para habilitar a emissão de notas fiscais</li>
        </ul>
      </div>
    </div>
  );
};