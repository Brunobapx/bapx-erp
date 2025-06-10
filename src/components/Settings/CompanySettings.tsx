
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Building } from 'lucide-react';

interface CompanySetting {
  key: string;
  value: any;
  description: string;
}

export const CompanySettings = () => {
  const [companyData, setCompanyData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'company');

      if (error) throw error;

      const settings = data?.reduce((acc, setting) => {
        acc[setting.key] = typeof setting.value === 'string' 
          ? JSON.parse(setting.value) 
          : setting.value;
        return acc;
      }, {} as any) || {};

      setCompanyData(settings);
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error);
    }
  };

  const saveCompanySettings = async () => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(companyData)) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: JSON.stringify(value) })
          .eq('key', key);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações da empresa salvas com sucesso!",
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

  const handleInputChange = (key: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Dados da Empresa</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Corporativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nome da Empresa</Label>
            <Input
              id="company_name"
              value={companyData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Nome da sua empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_email">Email Corporativo</Label>
            <Input
              id="company_email"
              type="email"
              value={companyData.company_email}
              onChange={(e) => handleInputChange('company_email', e.target.value)}
              placeholder="contato@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_phone">Telefone</Label>
            <Input
              id="company_phone"
              value={companyData.company_phone}
              onChange={(e) => handleInputChange('company_phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_address">Endereço</Label>
            <Textarea
              id="company_address"
              value={companyData.company_address}
              onChange={(e) => handleInputChange('company_address', e.target.value)}
              placeholder="Endereço completo da empresa"
              className="min-h-[100px]"
            />
          </div>

          <Button onClick={saveCompanySettings} disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
