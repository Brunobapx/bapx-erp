import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, FileText, Percent, Save, ExternalLink } from 'lucide-react';
import { useCompanyFiscalSettings } from '@/hooks/useCompanyFiscalSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const CompanyFiscalInfo = () => {
  const { settings, setSettings, loading, saving, saveSettings, getTaxInfo } = useCompanyFiscalSettings();
  const taxInfo = getTaxInfo();
  const [testingConnection, setTestingConnection] = useState(false);

  const testConnection = async () => {
    if (!settings.focus_nfe_token) {
      toast.error('Token Focus NFe é obrigatório');
      return;
    }

    setTestingConnection(true);
    try {
      console.log('Testando conexão com token:', settings.focus_nfe_token?.substring(0, 10) + '...');
      console.log('Ambiente:', settings.nota_fiscal_ambiente);
      
      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: {
          action: 'test_connection',
          token: settings.focus_nfe_token,
          environment: settings.nota_fiscal_ambiente
        }
      });

      console.log('Resposta da edge function:', { data, error });

      if (error) {
        console.error('Erro ao chamar edge function:', error);
        toast.error(`Erro ao chamar função: ${error.message || 'Erro desconhecido'}`);
        return;
      }

      if (!data) {
        console.error('Resposta vazia da edge function');
        toast.error('Resposta vazia da função');
        return;
      }

      if (data.success) {
        toast.success('Conexão com Focus NFe estabelecida com sucesso!');
      } else {
        const errorMsg = data.error || 'Erro na conexão com Focus NFe. Verifique o token.';
        console.error('Erro na resposta:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Erro ao testar conexão (catch):', error);
      toast.error(`Erro ao testar conexão: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setTestingConnection(false);
    }
  };

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

      {/* Configurações Fiscais Unificadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configurações Fiscais Unificadas
          </CardTitle>
          <CardDescription>
            Configurações fiscais completas para emissão de NF (NFe, NFCe, NFSe)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grupo 1: Regime e Códigos Base */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Regime Tributário e Códigos Base
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tax_regime">Regime Tributário *</Label>
                <Select
                  value={settings.tax_regime}
                  onValueChange={(value) => {
                    setSettings(prev => ({ ...prev, tax_regime: value }))
                  }}
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
              <div>
                <Label htmlFor="default_cfop">CFOP Padrão *</Label>
                <Input
                  id="default_cfop"
                  value={settings.default_cfop}
                  onChange={(e) => setSettings(prev => ({ ...prev, default_cfop: e.target.value }))}
                  placeholder="Ex: 5405"
                />
                <p className="text-xs text-muted-foreground mt-1">{taxInfo.cfop_description}</p>
              </div>
              <div>
                <Label htmlFor="default_ncm">NCM Padrão *</Label>
                <Input
                  id="default_ncm"
                  value={settings.default_ncm}
                  onChange={(e) => setSettings(prev => ({ ...prev, default_ncm: e.target.value }))}
                  placeholder="Ex: 19059090"
                />
                <p className="text-xs text-muted-foreground mt-1">Produtos de padaria</p>
              </div>
            </div>
          </div>

          {/* Grupo 2: ICMS */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              ICMS (Imposto sobre Circulação de Mercadorias)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="icms_cst">CST ICMS *</Label>
                <Input
                  id="icms_cst"
                  value={settings.icms_cst}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSettings(prev => ({ 
                      ...prev, 
                      icms_cst: newValue,
                      // Sincronizar com icms_percentual quando aplicável
                      icms_percentual: newValue === "60" ? "0" : prev.icms_percentual
                    }))
                  }}
                  placeholder="Ex: 60"
                />
                <p className="text-xs text-muted-foreground mt-1">{taxInfo.icms_description}</p>
              </div>
              <div>
                <Label htmlFor="icms_origem">Origem da Mercadoria *</Label>
                <Select
                  value={settings.icms_origem}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, icms_origem: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Nacional</SelectItem>
                    <SelectItem value="1">1 - Estrangeira (importação direta)</SelectItem>
                    <SelectItem value="2">2 - Estrangeira (mercado interno)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="icms_percentual">Alíquota ICMS (%)</Label>
                <Input
                  id="icms_percentual"
                  type="number"
                  step="0.01"
                  value={settings.icms_percentual}
                  onChange={(e) => setSettings(prev => ({ ...prev, icms_percentual: e.target.value }))}
                  placeholder="Ex: 18.00"
                  disabled={settings.icms_cst === "60"}
                />
                {settings.icms_cst === "60" && (
                  <p className="text-xs text-warning mt-1">ICMS por Substituição Tributária - Alíquota não aplicável</p>
                )}
              </div>
            </div>
          </div>

          {/* Grupo 3: PIS/COFINS */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              PIS/COFINS (Contribuições Sociais)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="pis_cst">CST PIS *</Label>
                    <Input
                      id="pis_cst"
                      value={settings.pis_cst}
                      onChange={(e) => setSettings(prev => ({ ...prev, pis_cst: e.target.value }))}
                      placeholder="Ex: 01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pis_aliquota">Alíquota PIS (%) *</Label>
                    <Input
                      id="pis_aliquota"
                      type="number"
                      step="0.01"
                      value={settings.pis_aliquota}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSettings(prev => ({ 
                          ...prev, 
                          pis_aliquota: value,
                          pis_percentual: value // Manter sincronizado
                        }))
                      }}
                      placeholder="1.65"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cofins_cst">CST COFINS *</Label>
                    <Input
                      id="cofins_cst"
                      value={settings.cofins_cst}
                      onChange={(e) => setSettings(prev => ({ ...prev, cofins_cst: e.target.value }))}
                      placeholder="Ex: 01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cofins_aliquota">Alíquota COFINS (%) *</Label>
                    <Input
                      id="cofins_aliquota"
                      type="number"
                      step="0.01"
                      value={settings.cofins_aliquota}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSettings(prev => ({ 
                          ...prev, 
                          cofins_aliquota: value,
                          cofins_percentual: value // Manter sincronizado
                        }))
                      }}
                      placeholder="7.60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grupo 4: Configurações da NFe */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Configurações de Emissão da NF
            </h4>
            
            {/* Switch de habilitação */}
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Switch
                id="focus_nfe_enabled"
                checked={settings.focus_nfe_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, focus_nfe_enabled: checked }))
                }
              />
              <Label htmlFor="focus_nfe_enabled" className="font-medium">
                Habilitar emissão via Focus NFe
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nota_fiscal_tipo">Tipo de Nota *</Label>
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nota_fiscal_ambiente">Ambiente *</Label>
                <Select
                  value={settings.nota_fiscal_ambiente}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, nota_fiscal_ambiente: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homologacao">🧪 Homologação (Teste)</SelectItem>
                    <SelectItem value="producao">🚀 Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="focus_nfe_token">Token Focus NFe *</Label>
                <Input
                  id="focus_nfe_token"
                  type="password"
                  value={settings.focus_nfe_token}
                  onChange={(e) => setSettings(prev => ({ ...prev, focus_nfe_token: e.target.value }))}
                  placeholder="Token da API Focus NFe"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para obter seu token, acesse a{' '}
                  <a 
                    href="https://focusnfe.com.br/painel/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    área do cliente Focus NFe
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
              <div>
                <Label htmlFor="cnpj_emissor">CNPJ Emissor *</Label>
                <Input
                  id="cnpj_emissor"
                  value={settings.cnpj_emissor || settings.company_cnpj}
                  onChange={(e) => setSettings(prev => ({ ...prev, cnpj_emissor: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="nfe_initial_number">Numeração Inicial da NFe</Label>
                <Input
                  id="nfe_initial_number"
                  type="number"
                  value={settings.nfe_initial_number}
                  onChange={(e) => setSettings(prev => ({ ...prev, nfe_initial_number: e.target.value }))}
                  placeholder="Ex: 1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Defina o número inicial para a numeração sequencial das notas fiscais
                </p>
              </div>
            </div>
          </div>

          {/* Grupo 5: Simples Nacional (condicional) */}
          {(settings.tax_regime === "1" || settings.tax_regime === "2") && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Configurações Simples Nacional
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="csosn_padrao">CSOSN Padrão *</Label>
                  <Input
                    id="csosn_padrao"
                    value={settings.csosn_padrao}
                    onChange={(e) => setSettings(prev => ({ ...prev, csosn_padrao: e.target.value }))}
                    placeholder="Ex: 101"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Código específico do Simples Nacional</p>
                </div>
                <div>
                  <Label htmlFor="empresa_tipo">Tipo de Empresa *</Label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Grupo 6: Regime Normal (condicional) */}
          {settings.tax_regime === "3" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Configurações Regime Normal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cst_padrao">CST Padrão *</Label>
                  <Input
                    id="cst_padrao"
                    value={settings.cst_padrao}
                    onChange={(e) => setSettings(prev => ({ ...prev, cst_padrao: e.target.value }))}
                    placeholder="Ex: 00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Código para empresas do Regime Normal</p>
                </div>
              </div>
            </div>
          )}

          {/* Resumo Fiscal */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="h-4 w-4" />
              <span className="font-medium">Resumo Fiscal Configurado</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><strong>Regime:</strong> {taxInfo.regime_description}</p>
                <p><strong>CFOP:</strong> {settings.default_cfop} - {taxInfo.cfop_description}</p>
                <p><strong>NCM:</strong> {settings.default_ncm}</p>
              </div>
              <div className="space-y-2">
                <p><strong>ICMS:</strong> CST {settings.icms_cst} - {taxInfo.icms_description}</p>
                <p><strong>PIS/COFINS:</strong> {taxInfo.pis_cofins_description}</p>
                <Badge variant="outline" className="mt-2">
                  Carga Total PIS/COFINS: {taxInfo.total_tax_rate.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando Configurações...' : 'Salvar Configurações Fiscais'}
            </Button>
            <Button 
              variant="outline" 
              onClick={testConnection}
              disabled={testingConnection || !settings.focus_nfe_token}
              className="flex items-center gap-2"
            >
              {testingConnection ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>

          {/* Informações importantes */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Guia de Configuração</span>
            </div>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• <strong>Teste sempre em Homologação</strong> antes de usar em Produção</p>
              <p>• <strong>Token Focus NFe:</strong> Obtenha em sua conta Focus NFe</p>
              <p>• <strong>Regime Tributário:</strong> Determina quais campos são obrigatórios</p>
              <p>• <strong>CFOP/NCM:</strong> Códigos fiscais específicos do seu produto/operação</p>
              <p>• <strong>Compatibilidade:</strong> Configurações funcionam para NFe, NFCe e NFSe</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyFiscalInfo;