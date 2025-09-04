import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Store, CreditCard, ArrowRightLeft, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CompanyStoreLink } from "./CompanyStoreLink";

interface CompanyData {
  id: string;
  code: string;
  name: string;
  cnpj?: string;
  razao_social?: string;
  inscricao_estadual?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  website?: string;
}

interface EcommerceSettings {
  id?: string;
  company_id: string;
  store_name: string;
  store_description?: string;
  store_logo_url?: string;
  mercado_pago_access_token?: string;
  mercado_pago_public_key?: string;
  shipping_settings: {
    free_shipping_min: number;
    default_shipping: number;
  };
  payment_methods: string[];
  is_active: boolean;
  custom_domain?: string;
  theme_settings: {
    primary_color: string;
    secondary_color: string;
  };
}

export function CompanyManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [ecommerceSettings, setEcommerceSettings] = useState<EcommerceSettings | null>(null);

  const brazilianStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      setLoading(true);

      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        toast({
          title: "Erro",
          description: "Usuário não está associado a uma empresa",
          variant: "destructive",
        });
        return;
      }

      // Load company data
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (companyError) {
        console.error('Error loading company:', companyError);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da empresa",
          variant: "destructive",
        });
        return;
      }

      setCompanyData(company);

      // Load e-commerce settings
      const { data: ecommerce } = await supabase
        .from('company_ecommerce_settings')
        .select('*')
        .eq('company_id', profile.company_id)
        .single();

      if (ecommerce) {
        setEcommerceSettings(ecommerce);
      } else {
        // Create default e-commerce settings
        const defaultSettings: EcommerceSettings = {
          company_id: profile.company_id,
          store_name: company.name || 'Minha Loja',
          is_active: false,
          shipping_settings: {
            free_shipping_min: 100,
            default_shipping: 15.90
          },
          payment_methods: ['credit_card', 'pix'],
          theme_settings: {
            primary_color: '#0066cc',
            secondary_color: '#ffffff'
          }
        };
        setEcommerceSettings(defaultSettings);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyData = async () => {
    if (!companyData) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          cnpj: companyData.cnpj,
          razao_social: companyData.razao_social,
          inscricao_estadual: companyData.inscricao_estadual,
          endereco: companyData.endereco,
          cidade: companyData.cidade,
          estado: companyData.estado,
          cep: companyData.cep,
          telefone: companyData.telefone,
          email: companyData.email,
          website: companyData.website,
        })
        .eq('id', companyData.id);

      if (error) {
        console.error('Error saving company data:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar dados da empresa",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Dados da empresa salvos com sucesso!",
      });

    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados da empresa",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveEcommerceSettings = async () => {
    if (!ecommerceSettings) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('company_ecommerce_settings')
        .upsert({
          ...ecommerceSettings,
          shipping_settings: JSON.stringify(ecommerceSettings.shipping_settings),
          payment_methods: JSON.stringify(ecommerceSettings.payment_methods),
          theme_settings: JSON.stringify(ecommerceSettings.theme_settings),
        });

      if (error) {
        console.error('Error saving e-commerce settings:', error);
        toast({
          title: "Erro", 
          description: "Erro ao salvar configurações do e-commerce",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Configurações do e-commerce salvos com sucesso!",
      });

    } catch (error) {
      console.error('Error saving e-commerce settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do e-commerce",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompanyInputChange = (field: keyof CompanyData, value: string) => {
    if (companyData) {
      setCompanyData({ ...companyData, [field]: value });
    }
  };

  const handleEcommerceInputChange = (field: keyof EcommerceSettings, value: any) => {
    if (ecommerceSettings) {
      setEcommerceSettings({ ...ecommerceSettings, [field]: value });
    }
  };

  const handlePaymentMethodToggle = (method: string, checked: boolean) => {
    if (!ecommerceSettings) return;

    const updatedMethods = checked
      ? [...ecommerceSettings.payment_methods, method]
      : ecommerceSettings.payment_methods.filter(m => m !== method);

    setEcommerceSettings({
      ...ecommerceSettings,
      payment_methods: updatedMethods
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gerenciamento da Empresa</h2>
        <p className="text-muted-foreground">
          Configure os dados da sua empresa e as configurações do e-commerce
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dados da Empresa
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            E-commerce
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Migração
          </TabsTrigger>
        </TabsList>

        {/* Company Data Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={companyData?.name || ''}
                    onChange={(e) => handleCompanyInputChange('name', e.target.value)}
                    placeholder="Nome fantasia"
                  />
                </div>
                <div>
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    value={companyData?.razao_social || ''}
                    onChange={(e) => handleCompanyInputChange('razao_social', e.target.value)}
                    placeholder="Razão social da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={companyData?.cnpj || ''}
                    onChange={(e) => handleCompanyInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricao_estadual"
                    value={companyData?.inscricao_estadual || ''}
                    onChange={(e) => handleCompanyInputChange('inscricao_estadual', e.target.value)}
                    placeholder="Número da inscrição estadual"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={companyData?.endereco || ''}
                    onChange={(e) => handleCompanyInputChange('endereco', e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={companyData?.cidade || ''}
                    onChange={(e) => handleCompanyInputChange('cidade', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={companyData?.estado || ''}
                    onValueChange={(value) => handleCompanyInputChange('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={companyData?.cep || ''}
                    onChange={(e) => handleCompanyInputChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={companyData?.telefone || ''}
                    onChange={(e) => handleCompanyInputChange('telefone', e.target.value)}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData?.email || ''}
                    onChange={(e) => handleCompanyInputChange('email', e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={companyData?.website || ''}
                  onChange={(e) => handleCompanyInputChange('website', e.target.value)}
                  placeholder="https://www.empresa.com"
                />
              </div>

              <Button onClick={saveCompanyData} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Dados da Empresa'}
              </Button>
              </CardContent>
            </Card>
            
            {/* Link da Loja */}
            {companyData && ecommerceSettings && (
              <CompanyStoreLink
                companyCode={companyData.code}
                storeName={ecommerceSettings.store_name}
                isActive={ecommerceSettings.is_active}
                customDomain={ecommerceSettings.custom_domain}
              />
            )}
          </TabsContent>

        {/* E-commerce Tab */}
        <TabsContent value="ecommerce" className="space-y-6">
          {ecommerceSettings && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Configurações da Loja
                    {ecommerceSettings.is_active && (
                      <Badge variant="secondary">Ativa</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ecommerceSettings.is_active}
                      onCheckedChange={(checked) => handleEcommerceInputChange('is_active', checked)}
                    />
                    <Label>Loja Online Ativa</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="store_name">Nome da Loja *</Label>
                      <Input
                        id="store_name"
                        value={ecommerceSettings.store_name}
                        onChange={(e) => handleEcommerceInputChange('store_name', e.target.value)}
                        placeholder="Nome da sua loja online"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom_domain">Domínio Personalizado</Label>
                      <Input
                        id="custom_domain"
                        value={ecommerceSettings.custom_domain || ''}
                        onChange={(e) => handleEcommerceInputChange('custom_domain', e.target.value)}
                        placeholder="loja.minhaempresa.com.br"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="store_description">Descrição da Loja</Label>
                    <Textarea
                      id="store_description"
                      value={ecommerceSettings.store_description || ''}
                      onChange={(e) => handleEcommerceInputChange('store_description', e.target.value)}
                      placeholder="Descrição da sua loja online"
                      rows={3}
                    />
                  </div>

                  {ecommerceSettings.is_active && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">Link da Loja:</span>
                      </div>
                      <code className="text-sm bg-background px-2 py-1 rounded">
                        {ecommerceSettings.custom_domain 
                          ? `https://${ecommerceSettings.custom_domain}` 
                          : `${window.location.origin}/loja`
                        }
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mp_access_token">Mercado Pago - Access Token</Label>
                      <Input
                        id="mp_access_token"
                        type="password"
                        value={ecommerceSettings.mercado_pago_access_token || ''}
                        onChange={(e) => handleEcommerceInputChange('mercado_pago_access_token', e.target.value)}
                        placeholder="Access token do Mercado Pago"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mp_public_key">Mercado Pago - Public Key</Label>
                      <Input
                        id="mp_public_key"
                        value={ecommerceSettings.mercado_pago_public_key || ''}
                        onChange={(e) => handleEcommerceInputChange('mercado_pago_public_key', e.target.value)}
                        placeholder="Public key do Mercado Pago"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Métodos de Pagamento Aceitos</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={ecommerceSettings.payment_methods.includes('credit_card')}
                          onCheckedChange={(checked) => handlePaymentMethodToggle('credit_card', checked)}
                        />
                        <Label>Cartão de Crédito</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={ecommerceSettings.payment_methods.includes('pix')}
                          onCheckedChange={(checked) => handlePaymentMethodToggle('pix', checked)}
                        />
                        <Label>PIX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={ecommerceSettings.payment_methods.includes('boleto')}
                          onCheckedChange={(checked) => handlePaymentMethodToggle('boleto', checked)}
                        />
                        <Label>Boleto</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="free_shipping_min">Frete Grátis Acima de (R$)</Label>
                      <Input
                        id="free_shipping_min"
                        type="number"
                        step="0.01"
                        value={ecommerceSettings.shipping_settings.free_shipping_min}
                        onChange={(e) => handleEcommerceInputChange('shipping_settings', {
                          ...ecommerceSettings.shipping_settings,
                          free_shipping_min: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="default_shipping">Frete Padrão (R$)</Label>
                      <Input
                        id="default_shipping"
                        type="number"
                        step="0.01"
                        value={ecommerceSettings.shipping_settings.default_shipping}
                        onChange={(e) => handleEcommerceInputChange('shipping_settings', {
                          ...ecommerceSettings.shipping_settings,
                          default_shipping: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={saveEcommerceSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações do E-commerce'}
              </Button>
            </>
          )}
        </TabsContent>

        {/* Migration Tab */}
        <TabsContent value="migration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Migração de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Esta funcionalidade permite transferir dados entre empresas. 
                  Útil quando há mudança de conta ou fusão de empresas.
                </p>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Atenção</h4>
                  <p className="text-sm text-yellow-700">
                    A migração de dados é um processo irreversível. Entre em contato com o suporte 
                    para realizar transferências de dados entre empresas.
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Solicitar Migração (Em breve)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}