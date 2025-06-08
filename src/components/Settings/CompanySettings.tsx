
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/components/Auth/CompanyProvider";
import { Save, Building, Palette, Upload } from 'lucide-react';

export const CompanySettings = () => {
  const { company, loadCompany } = useCompanyContext();
  const [companyData, setCompanyData] = useState({
    name: '',
    subdomain: '',
    primary_color: '#2563eb',
    secondary_color: '#1e40af',
    logo_url: '',
    settings: {
      company_email: '',
      company_phone: '',
      company_address: '',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR'
    }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setCompanyData({
        name: company.name || '',
        subdomain: company.subdomain || '',
        primary_color: company.primary_color || '#2563eb',
        secondary_color: company.secondary_color || '#1e40af',
        logo_url: company.logo_url || '',
        settings: {
          company_email: company.settings?.company_email || '',
          company_phone: company.settings?.company_phone || '',
          company_address: company.settings?.company_address || '',
          timezone: company.settings?.timezone || 'America/Sao_Paulo',
          currency: company.settings?.currency || 'BRL',
          language: company.settings?.language || 'pt-BR'
        }
      });
    }
  }, [company]);

  const saveCompanySettings = async () => {
    if (!company) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          primary_color: companyData.primary_color,
          secondary_color: companyData.secondary_color,
          logo_url: companyData.logo_url,
          settings: companyData.settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações da empresa salvas com sucesso!",
      });

      // Recarregar dados da empresa para aplicar mudanças
      await loadCompany();
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

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('settings.')) {
      const settingKey = field.replace('settings.', '');
      setCompanyData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value
        }
      }));
    } else {
      setCompanyData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const previewColors = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary', companyData.primary_color);
    root.style.setProperty('--secondary', companyData.secondary_color);
  };

  if (!company) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Carregando configurações da empresa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações da Empresa</h3>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={companyData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomínio</Label>
              <Input
                id="subdomain"
                value={companyData.subdomain}
                onChange={(e) => handleInputChange('subdomain', e.target.value)}
                placeholder="minha-empresa"
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">
                O subdomínio não pode ser alterado após a criação
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_email">Email Corporativo</Label>
              <Input
                id="company_email"
                type="email"
                value={companyData.settings.company_email}
                onChange={(e) => handleInputChange('settings.company_email', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone">Telefone</Label>
              <Input
                id="company_phone"
                value={companyData.settings.company_phone}
                onChange={(e) => handleInputChange('settings.company_phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_address">Endereço</Label>
            <Textarea
              id="company_address"
              value={companyData.settings.company_address}
              onChange={(e) => handleInputChange('settings.company_address', e.target.value)}
              placeholder="Endereço completo da empresa"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Personalização Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalização Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={companyData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={companyData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={companyData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={companyData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">URL do Logo</Label>
            <Input
              id="logo_url"
              value={companyData.logo_url}
              onChange={(e) => handleInputChange('logo_url', e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
          </div>

          <Button 
            onClick={previewColors} 
            variant="outline" 
            className="w-full"
          >
            Visualizar Cores
          </Button>
        </CardContent>
      </Card>

      {/* Configurações Regionais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Regionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <select
                id="timezone"
                value={companyData.settings.timezone}
                onChange={(e) => handleInputChange('settings.timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <select
                id="currency"
                value={companyData.settings.currency}
                onChange={(e) => handleInputChange('settings.currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                value={companyData.settings.language}
                onChange={(e) => handleInputChange('settings.language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
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
