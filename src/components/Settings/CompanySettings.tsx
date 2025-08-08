
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Building, FileText, MapPin, User } from 'lucide-react';

interface CompanySetting {
  key: string;
  value: any;
  description: string;
}

export const CompanySettings = () => {
  const [companyData, setCompanyData] = useState({
    // Dados básicos
    company_name: '',
    company_fantasy_name: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    
    // Identificação fiscal
    company_cnpj: '',
    company_ie: '',
    company_im: '',
    company_crt: '1',
    company_cnae: '',
    company_legal_nature: '',
    company_share_capital: '0',
    company_activity_start: '',
    
    // Endereço completo
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
    company_responsible_cpf: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id || '')
        .maybeSingle();

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'company')
        .eq('company_id', profile?.company_id);

      if (error) throw error;

      const settings = data?.reduce((acc, setting) => {
        try {
          acc[setting.key] = typeof setting.value === 'string' && setting.value.trim() !== ''
            ? JSON.parse(setting.value) 
            : setting.value;
        } catch (parseError) {
          console.warn(`Error parsing setting ${setting.key}:`, parseError);
          acc[setting.key] = setting.value; // Use raw value if parsing fails
        }
        return acc;
      }, {} as any) || {};

      setCompanyData(prev => ({ ...prev, ...settings }));
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error);
    }
  };

  const saveCompanySettings = async () => {
    setLoading(true);
    try {
      const payload = Object.entries(companyData).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        description: getFieldDescription(key),
        category: 'company',
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(payload, { onConflict: 'company_id,key' });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações da empresa salvas com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
      company_crt: 'Código de Regime Tributário',
      company_cnae: 'CNAE Principal',
      company_legal_nature: 'Natureza Jurídica',
      company_share_capital: 'Capital Social',
      company_activity_start: 'Data de Início das Atividades',
      company_cep: 'CEP da Empresa',
      company_street: 'Logradouro/Rua',
      company_number: 'Número',
      company_complement: 'Complemento',
      company_neighborhood: 'Bairro',
      company_city: 'Cidade',
      company_state: 'Estado (UF)',
      company_ibge_city_code: 'Código IBGE da Cidade',
      company_country: 'País',
      company_country_code: 'Código do País',
      company_responsible_name: 'Nome do Responsável',
      company_responsible_cpf: 'CPF do Responsável'
    };
    return descriptions[key] || key;
  };

  const handleInputChange = (key: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [key]: value
    }));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações da Empresa - SEFAZ 4.0</h3>
      </div>

      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Dados Básicos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Razão Social *</Label>
            <Input
              id="company_name"
              value={companyData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Razão social da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_fantasy_name">Nome Fantasia</Label>
            <Input
              id="company_fantasy_name"
              value={companyData.company_fantasy_name}
              onChange={(e) => handleInputChange('company_fantasy_name', e.target.value)}
              placeholder="Nome fantasia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_email">Email Corporativo *</Label>
            <Input
              id="company_email"
              type="email"
              value={companyData.company_email}
              onChange={(e) => handleInputChange('company_email', e.target.value)}
              placeholder="contato@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_phone">Telefone *</Label>
            <Input
              id="company_phone"
              value={companyData.company_phone}
              onChange={(e) => handleInputChange('company_phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_website">Site</Label>
            <Input
              id="company_website"
              value={companyData.company_website}
              onChange={(e) => handleInputChange('company_website', e.target.value)}
              placeholder="www.empresa.com.br"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_activity_start">Início das Atividades</Label>
            <Input
              id="company_activity_start"
              type="date"
              value={companyData.company_activity_start}
              onChange={(e) => handleInputChange('company_activity_start', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Identificação Fiscal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Identificação Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_cnpj">CNPJ *</Label>
            <Input
              id="company_cnpj"
              value={companyData.company_cnpj}
              onChange={(e) => handleInputChange('company_cnpj', formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_ie">Inscrição Estadual</Label>
            <Input
              id="company_ie"
              value={companyData.company_ie}
              onChange={(e) => handleInputChange('company_ie', e.target.value)}
              placeholder="Inscrição Estadual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_im">Inscrição Municipal</Label>
            <Input
              id="company_im"
              value={companyData.company_im}
              onChange={(e) => handleInputChange('company_im', e.target.value)}
              placeholder="Inscrição Municipal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_crt">Regime Tributário *</Label>
            <Select value={companyData.company_crt} onValueChange={(value) => handleInputChange('company_crt', value)}>
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
            <Label htmlFor="company_cnae">CNAE Principal</Label>
            <Input
              id="company_cnae"
              value={companyData.company_cnae}
              onChange={(e) => handleInputChange('company_cnae', e.target.value)}
              placeholder="0000-0/00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_legal_nature">Natureza Jurídica</Label>
            <Input
              id="company_legal_nature"
              value={companyData.company_legal_nature}
              onChange={(e) => handleInputChange('company_legal_nature', e.target.value)}
              placeholder="Ex: Sociedade Empresária Limitada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_share_capital">Capital Social (R$)</Label>
            <Input
              id="company_share_capital"
              type="number"
              step="0.01"
              value={companyData.company_share_capital}
              onChange={(e) => handleInputChange('company_share_capital', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_cep">CEP *</Label>
            <Input
              id="company_cep"
              value={companyData.company_cep}
              onChange={(e) => handleInputChange('company_cep', formatCEP(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_street">Logradouro/Rua *</Label>
            <Input
              id="company_street"
              value={companyData.company_street}
              onChange={(e) => handleInputChange('company_street', e.target.value)}
              placeholder="Nome da rua, avenida, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_number">Número *</Label>
            <Input
              id="company_number"
              value={companyData.company_number}
              onChange={(e) => handleInputChange('company_number', e.target.value)}
              placeholder="123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_complement">Complemento</Label>
            <Input
              id="company_complement"
              value={companyData.company_complement}
              onChange={(e) => handleInputChange('company_complement', e.target.value)}
              placeholder="Sala, andar, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_neighborhood">Bairro *</Label>
            <Input
              id="company_neighborhood"
              value={companyData.company_neighborhood}
              onChange={(e) => handleInputChange('company_neighborhood', e.target.value)}
              placeholder="Nome do bairro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_city">Cidade *</Label>
            <Input
              id="company_city"
              value={companyData.company_city}
              onChange={(e) => handleInputChange('company_city', e.target.value)}
              placeholder="Nome da cidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_state">Estado (UF) *</Label>
            <Input
              id="company_state"
              value={companyData.company_state}
              onChange={(e) => handleInputChange('company_state', e.target.value.toUpperCase())}
              placeholder="SP"
              maxLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_ibge_city_code">Código IBGE da Cidade</Label>
            <Input
              id="company_ibge_city_code"
              value={companyData.company_ibge_city_code}
              onChange={(e) => handleInputChange('company_ibge_city_code', e.target.value)}
              placeholder="3550308"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_country">País</Label>
            <Input
              id="company_country"
              value={companyData.company_country}
              onChange={(e) => handleInputChange('company_country', e.target.value)}
              placeholder="Brasil"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_country_code">Código do País</Label>
            <Input
              id="company_country_code"
              value={companyData.company_country_code}
              onChange={(e) => handleInputChange('company_country_code', e.target.value)}
              placeholder="1058"
            />
          </div>
        </CardContent>
      </Card>

      {/* Responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Responsável Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_responsible_name">Nome do Responsável</Label>
            <Input
              id="company_responsible_name"
              value={companyData.company_responsible_name}
              onChange={(e) => handleInputChange('company_responsible_name', e.target.value)}
              placeholder="Nome completo do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_responsible_cpf">CPF do Responsável</Label>
            <Input
              id="company_responsible_cpf"
              value={companyData.company_responsible_cpf}
              onChange={(e) => handleInputChange('company_responsible_cpf', formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveCompanySettings} disabled={loading} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  );
};
