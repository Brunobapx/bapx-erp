
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Settings } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: any;
  description: string;
  category: string;
}

export const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'general')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(value) })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      ));

      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configuração",
        variant: "destructive",
      });
    }
  };

  const saveAllSettings = async () => {
    setLoading(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: JSON.stringify(setting.value) })
          .eq('key', setting.key);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Todas as configurações foram salvas!",
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

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = typeof setting.value === 'string' 
      ? JSON.parse(setting.value) 
      : setting.value;

    switch (typeof value) {
      case 'boolean':
        return (
          <Switch
            checked={value}
            onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value))}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações Gerais</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium">{setting.description}</Label>
                <p className="text-sm text-muted-foreground">{setting.key}</p>
              </div>
              <div className="w-48">
                {renderSettingInput(setting)}
              </div>
            </div>
          ))}

          <Button onClick={saveAllSettings} disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Todas as Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
