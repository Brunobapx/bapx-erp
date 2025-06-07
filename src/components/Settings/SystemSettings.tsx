
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Settings, Database, Mail, Bell } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: any;
  description: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const defaultSettings: SystemSetting[] = [
    {
      key: 'app_name',
      value: 'Sistema de Gestão',
      description: 'Nome da Aplicação',
      category: 'general',
      type: 'string'
    },
    {
      key: 'max_users',
      value: 100,
      description: 'Máximo de Usuários',
      category: 'general',
      type: 'number'
    },
    {
      key: 'auto_backup',
      value: true,
      description: 'Backup Automático',
      category: 'general',
      type: 'boolean'
    },
    {
      key: 'backup_frequency',
      value: 'daily',
      description: 'Frequência de Backup',
      category: 'general',
      type: 'select',
      options: ['hourly', 'daily', 'weekly', 'monthly']
    },
    {
      key: 'notification_emails',
      value: true,
      description: 'Emails de Notificação',
      category: 'notifications',
      type: 'boolean'
    },
    {
      key: 'system_maintenance',
      value: false,
      description: 'Modo Manutenção',
      category: 'general',
      type: 'boolean'
    },
    {
      key: 'data_retention_days',
      value: 365,
      description: 'Retenção de Dados (dias)',
      category: 'general',
      type: 'number'
    }
  ];

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
      
      if (data && data.length > 0) {
        const loadedSettings = data.map(item => {
          const defaultSetting = defaultSettings.find(ds => ds.key === item.key);
          return {
            ...defaultSetting,
            key: item.key,
            value: typeof item.value === 'string' ? JSON.parse(item.value) : item.value,
            description: item.description || defaultSetting?.description || item.key
          } as SystemSetting;
        });
        setSettings(loadedSettings);
      } else {
        // Se não há dados, usar configurações padrão
        setSettings(defaultSettings);
        await initializeDefaultSettings();
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSettings(defaultSettings);
    }
  };

  const initializeDefaultSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsToInsert = defaultSettings.map(setting => ({
        key: setting.key,
        value: JSON.stringify(setting.value),
        description: setting.description,
        category: setting.category,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('system_settings')
        .insert(settingsToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao inicializar configurações:', error);
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
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value}
            onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value) || 0)}
            className="w-32"
          />
        );
      case 'select':
        return (
          <Select value={setting.value} onValueChange={(value) => handleSettingChange(setting.key, value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-64"
          />
        );
    }
  };

  const generalSettings = settings.filter(s => s.category === 'general');
  const notificationSettings = settings.filter(s => s.category === 'notifications');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generalSettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium">{setting.description}</Label>
                <p className="text-sm text-muted-foreground">{setting.key}</p>
              </div>
              <div>
                {renderSettingInput(setting)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationSettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium">{setting.description}</Label>
                <p className="text-sm text-muted-foreground">{setting.key}</p>
              </div>
              <div>
                {renderSettingInput(setting)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={saveAllSettings} disabled={loading} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {loading ? 'Salvando...' : 'Salvar Todas as Configurações'}
      </Button>
    </div>
  );
};
