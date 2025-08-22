import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Building, FileText, MapPin, User, Percent, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FiscalValidation } from './FiscalValidation';
import { FiscalOperationsSection } from './FiscalOperationsSection';
import { TaxCalculationRulesSection } from './TaxCalculationRulesSection';

interface UnifiedSettings {
  // Dados básicos da empresa
  company_name: string;
  company_fantasy_name: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  company_cnpj: string;
  company_ie: string;
  company_im: string;
  company_activity_start: string;
  
  // Endereço
  company_cep: string;
  company_street: string;
  company_number: string;
  company_complement: string;
  company_neighborhood: string;
  company_city: string;
  company_state: string;
  company_ibge_city_code: string;
  company_country: string;
  company_country_code: string;
  
  // Responsável Legal
  company_responsible_name: string;
  company_responsible_cpf: string;
  
  // Configurações Fiscais
  tax_regime: string;
  default_cfop: string;
  default_ncm: string;
  icms_cst: string;
  icms_origem: string;
  icms_percentual: string;
  pis_cst: string;
  pis_aliquota: string;
  cofins_cst: string;
  cofins_aliquota: string;
  
  // Focus NFe
  focus_nfe_enabled: boolean;
  focus_nfe_token: string;
  nota_fiscal_ambiente: string;
  nota_fiscal_tipo: string;
}

export const CompanyUnifiedSettings = () => {
  const [settings, setSettings] = useState<UnifiedSettings>({
    // Dados básicos
    company_name: '',
    company_fantasy_name: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    company_cnpj: '',
    company_ie: '',
    company_im: '',
    company_activity_start: '',
    
    // Endereço
    company_cep: '',
    company_street: '',
    company_number: '',
    company_complement: '',
    company_neighborhood: '',
    company_city: '',
    company_state: '',
    company_ibge_city_code: '',
    company_country: 'Brasil',
    company_country_code: '1058',
    
    // Responsável
    company_responsible_name: '',
    company_responsible_cpf: '',
    
    // Fiscal
    tax_regime: '1',
    default_cfop: '5405',
    default_ncm: '19059090',
    icms_cst: '60',
    icms_origem: '0',
    icms_percentual: '18',
    pis_cst: '01',
    pis_aliquota: '1.65',
    cofins_cst: '01',
    cofins_aliquota: '7.60',
    
    // Focus NFe
    focus_nfe_enabled: false,
    focus_nfe_token: '',
    nota_fiscal_ambiente: 'homologacao',
    nota_fiscal_tipo: 'nfe'
  });

  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    identification: true,
    address: false,
    fiscal: false,
    focusNfe: false,
    responsible: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        try {
          acc[setting.key] = typeof setting.value === 'string' && setting.value.trim() !== ''
            ? JSON.parse(setting.value) 
            : setting.value;
        } catch (parseError) {
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {} as any) || {};

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('key');

      const existingKeys = existingSettings?.map(s => s.key) || [];

      for (const [key, value] of Object.entries(settings)) {
        if (existingKeys.includes(key)) {
          const { error } = await supabase
            .from('system_settings')
            .update({ 
              value: JSON.stringify(value),
              category: getCategoryForKey(key)
            })
            .eq('key', key);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('system_settings')
            .insert({
              key,
              value: JSON.stringify(value),
              description: getFieldDescription(key),
              category: getCategoryForKey(key)
            });

          if (error) throw error;
        }
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryForKey = (key: string): string => {
    if (key.includes('focus_nfe') || key.includes('nota_fiscal') || key.includes('tax_') || 
        key.includes('icms_') || key.includes('pis_') || key.includes('cofins_') || 
        key.includes('default_')) {
      return 'fiscal';
    }
    return 'company';
  };

  const getFieldDescription = (key: string): string => {
    const descriptions: { [key: string]: string } = {
      company_name: 'Nome da Empresa',
      company_fantasy_name: 'Nome Fantasia',
      company_email: 'Email Corporativo',
      company_phone: 'Telefone',
      company_website: 'Site da Empresa',
      company_cnpj: 'CNPJ da Empresa',
      company_ie: 'Inscrição Estadual',
      company_im: 'Inscrição Municipal',
      tax_regime: 'Regime Tributário',
      default_cfop: 'CFOP Padrão',
      default_ncm: 'NCM Padrão',
      icms_cst: 'CST ICMS',
      icms_origem: 'Origem da Mercadoria',
      icms_percentual: 'Alíquota ICMS',
      pis_cst: 'CST PIS',
      pis_aliquota: 'Alíquota PIS',
      cofins_cst: 'CST COFINS',
      cofins_aliquota: 'Alíquota COFINS',
      focus_nfe_enabled: 'Focus NFe Habilitado',
      focus_nfe_token: 'Token Focus NFe',
      nota_fiscal_ambiente: 'Ambiente NF',
      nota_fiscal_tipo: 'Tipo de Nota Fiscal'
    };
    return descriptions[key] || key;
  };

  const testConnection = async () => {
    if (!settings.focus_nfe_token) {
      toast({
        title: "Erro",
        description: "Token Focus NFe é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: {
          action: 'test_connection',
          token: settings.focus_nfe_token,
          environment: settings.nota_fiscal_ambiente
        }
      });

      if (error) {
        toast({
          title: "Erro",
          description: `Erro ao chamar função: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Sucesso",
          description: "Conexão com Focus NFe estabelecida com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: data?.error || "Erro na conexão com Focus NFe",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao testar conexão: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleInputChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações Empresa & Fiscal</h3>
      </div>

      {/* Seção: Identificação da Empresa */}
      <Card>
        <Collapsible 
          open={sectionsOpen.identification} 
          onOpenChange={() => toggleSection('identification')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Identificação da Empresa
                <Badge variant="outline" className="ml-auto">
                  {sectionsOpen.identification ? 'Ocultar' : 'Expandir'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Razão Social *</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Razão social da empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_fantasy_name">Nome Fantasia</Label>
                <Input
                  id="company_fantasy_name"
                  value={settings.company_fantasy_name}
                  onChange={(e) => handleInputChange('company_fantasy_name', e.target.value)}
                  placeholder="Nome fantasia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_cnpj">CNPJ *</Label>
                <Input
                  id="company_cnpj"
                  value={settings.company_cnpj}
                  onChange={(e) => handleInputChange('company_cnpj', formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_ie">Inscrição Estadual</Label>
                <Input
                  id="company_ie"
                  value={settings.company_ie}
                  onChange={(e) => handleInputChange('company_ie', e.target.value)}
                  placeholder="Inscrição Estadual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_im">Inscrição Municipal</Label>
                <Input
                  id="company_im"
                  value={settings.company_im}
                  onChange={(e) => handleInputChange('company_im', e.target.value)}
                  placeholder="Inscrição Municipal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">Email Corporativo *</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={settings.company_email}
                  onChange={(e) => handleInputChange('company_email', e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone">Telefone *</Label>
                <Input
                  id="company_phone"
                  value={settings.company_phone}
                  onChange={(e) => handleInputChange('company_phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_website">Site</Label>
                <Input
                  id="company_website"
                  value={settings.company_website}
                  onChange={(e) => handleInputChange('company_website', e.target.value)}
                  placeholder="www.empresa.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_activity_start">Início das Atividades</Label>
                <Input
                  id="company_activity_start"
                  type="date"
                  value={settings.company_activity_start}
                  onChange={(e) => handleInputChange('company_activity_start', e.target.value)}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção: Endereço Comercial */}
      <Card>
        <Collapsible 
          open={sectionsOpen.address} 
          onOpenChange={() => toggleSection('address')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço Comercial
                <Badge variant="outline" className="ml-auto">
                  {sectionsOpen.address ? 'Ocultar' : 'Expandir'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_cep">CEP *</Label>
                <Input
                  id="company_cep"
                  value={settings.company_cep}
                  onChange={(e) => handleInputChange('company_cep', formatCEP(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company_street">Logradouro/Rua *</Label>
                <Input
                  id="company_street"
                  value={settings.company_street}
                  onChange={(e) => handleInputChange('company_street', e.target.value)}
                  placeholder="Nome da rua, avenida, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_number">Número *</Label>
                <Input
                  id="company_number"
                  value={settings.company_number}
                  onChange={(e) => handleInputChange('company_number', e.target.value)}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_complement">Complemento</Label>
                <Input
                  id="company_complement"
                  value={settings.company_complement}
                  onChange={(e) => handleInputChange('company_complement', e.target.value)}
                  placeholder="Sala, andar, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_neighborhood">Bairro *</Label>
                <Input
                  id="company_neighborhood"
                  value={settings.company_neighborhood}
                  onChange={(e) => handleInputChange('company_neighborhood', e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_city">Cidade *</Label>
                <Input
                  id="company_city"
                  value={settings.company_city}
                  onChange={(e) => handleInputChange('company_city', e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_state">Estado (UF) *</Label>
                <Input
                  id="company_state"
                  value={settings.company_state}
                  onChange={(e) => handleInputChange('company_state', e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_ibge_city_code">Código IBGE da Cidade</Label>
                <Input
                  id="company_ibge_city_code"
                  value={settings.company_ibge_city_code}
                  onChange={(e) => handleInputChange('company_ibge_city_code', e.target.value)}
                  placeholder="3550308"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção: Configurações Tributárias */}
      <Card>
        <Collapsible 
          open={sectionsOpen.fiscal} 
          onOpenChange={() => toggleSection('fiscal')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Configurações Tributárias
                <Badge variant="outline" className="ml-auto">
                  {sectionsOpen.fiscal ? 'Ocultar' : 'Expandir'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Regime e Códigos Base */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_regime">Regime Tributário *</Label>
                  <Select value={settings.tax_regime} onValueChange={(value) => handleInputChange('tax_regime', value)}>
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
                  <Label htmlFor="default_cfop">CFOP Padrão *</Label>
                  <Input
                    id="default_cfop"
                    value={settings.default_cfop}
                    onChange={(e) => handleInputChange('default_cfop', e.target.value)}
                    placeholder="Ex: 5405"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_ncm">NCM Padrão *</Label>
                  <Input
                    id="default_ncm"
                    value={settings.default_ncm}
                    onChange={(e) => handleInputChange('default_ncm', e.target.value)}
                    placeholder="Ex: 19059090"
                  />
                </div>
              </div>

              {/* ICMS */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">ICMS</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icms_cst">CST ICMS *</Label>
                    <Input
                      id="icms_cst"
                      value={settings.icms_cst}
                      onChange={(e) => handleInputChange('icms_cst', e.target.value)}
                      placeholder="Ex: 60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icms_origem">Origem da Mercadoria *</Label>
                    <Select value={settings.icms_origem} onValueChange={(value) => handleInputChange('icms_origem', value)}>
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

                  <div className="space-y-2">
                    <Label htmlFor="icms_percentual">Alíquota ICMS (%)</Label>
                    <Input
                      id="icms_percentual"
                      type="number"
                      step="0.01"
                      value={settings.icms_percentual}
                      onChange={(e) => handleInputChange('icms_percentual', e.target.value)}
                      placeholder="Ex: 18.00"
                    />
                  </div>
                </div>
              </div>

              {/* PIS/COFINS */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">PIS/COFINS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="pis_cst">CST PIS *</Label>
                      <Input
                        id="pis_cst"
                        value={settings.pis_cst}
                        onChange={(e) => handleInputChange('pis_cst', e.target.value)}
                        placeholder="Ex: 01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pis_aliquota">Alíquota PIS (%) *</Label>
                      <Input
                        id="pis_aliquota"
                        type="number"
                        step="0.01"
                        value={settings.pis_aliquota}
                        onChange={(e) => handleInputChange('pis_aliquota', e.target.value)}
                        placeholder="1.65"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="cofins_cst">CST COFINS *</Label>
                      <Input
                        id="cofins_cst"
                        value={settings.cofins_cst}
                        onChange={(e) => handleInputChange('cofins_cst', e.target.value)}
                        placeholder="Ex: 01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cofins_aliquota">Alíquota COFINS (%) *</Label>
                      <Input
                        id="cofins_aliquota"
                        type="number"
                        step="0.01"
                        value={settings.cofins_aliquota}
                        onChange={(e) => handleInputChange('cofins_aliquota', e.target.value)}
                        placeholder="7.60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção: Focus NFe & Emissão */}
      <Card>
        <Collapsible 
          open={sectionsOpen.focusNfe} 
          onOpenChange={() => toggleSection('focusNfe')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Focus NFe & Emissão
                <Badge variant="outline" className="ml-auto">
                  {sectionsOpen.focusNfe ? 'Ocultar' : 'Expandir'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Switch
                  id="focus_nfe_enabled"
                  checked={settings.focus_nfe_enabled}
                  onCheckedChange={(checked) => handleInputChange('focus_nfe_enabled', checked)}
                />
                <Label htmlFor="focus_nfe_enabled" className="font-medium">
                  Habilitar emissão via Focus NFe
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nota_fiscal_tipo">Tipo de Nota *</Label>
                  <Select value={settings.nota_fiscal_tipo} onValueChange={(value) => handleInputChange('nota_fiscal_tipo', value)}>
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

                <div className="space-y-2">
                  <Label htmlFor="nota_fiscal_ambiente">Ambiente *</Label>
                  <Select value={settings.nota_fiscal_ambiente} onValueChange={(value) => handleInputChange('nota_fiscal_ambiente', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">Homologação (Teste)</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="focus_nfe_token">Token Focus NFe</Label>
                  <div className="flex gap-2">
                    <Input
                      id="focus_nfe_token"
                      type="password"
                      value={settings.focus_nfe_token}
                      onChange={(e) => handleInputChange('focus_nfe_token', e.target.value)}
                      placeholder="Token da API Focus NFe"
                    />
                    <Button 
                      onClick={testConnection} 
                      disabled={testingConnection || !settings.focus_nfe_token}
                      variant="outline"
                    >
                      {testingConnection ? 'Testando...' : 'Testar'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção: Responsável Legal */}
      <Card>
        <Collapsible 
          open={sectionsOpen.responsible} 
          onOpenChange={() => toggleSection('responsible')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Responsável Legal
                <Badge variant="outline" className="ml-auto">
                  {sectionsOpen.responsible ? 'Ocultar' : 'Expandir'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_responsible_name">Nome do Responsável</Label>
                <Input
                  id="company_responsible_name"
                  value={settings.company_responsible_name}
                  onChange={(e) => handleInputChange('company_responsible_name', e.target.value)}
                  placeholder="Nome completo do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_responsible_cpf">CPF do Responsável</Label>
                <Input
                  id="company_responsible_cpf"
                  value={settings.company_responsible_cpf}
                  onChange={(e) => handleInputChange('company_responsible_cpf', formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Validação Fiscal */}
      <FiscalValidation settings={settings} />

      {/* CFOPs por Operação */}
      <FiscalOperationsSection />

      {/* Regras de Cálculo de Impostos */}
      <TaxCalculationRulesSection />

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </Button>
      </div>
    </div>
  );
};