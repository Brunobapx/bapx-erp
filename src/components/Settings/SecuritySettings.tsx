
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Shield, Key, Lock, Eye, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

// Input validation schemas
const sessionTimeoutSchema = z.number().min(5).max(1440);
const passwordLengthSchema = z.number().min(6).max(128);
const maxLoginAttemptsSchema = z.number().min(3).max(10);

interface SecuritySetting {
  key: string;
  value: any;
  description: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export const SecuritySettings = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const defaultSecuritySettings: SecuritySetting[] = [
    {
      key: 'session_timeout',
      value: 30,
      description: 'Timeout da Sessão (minutos)',
      category: 'authentication',
      type: 'number'
    },
    {
      key: 'enable_two_factor',
      value: false,
      description: 'Autenticação de Dois Fatores',
      category: 'authentication',
      type: 'boolean'
    },
    {
      key: 'password_min_length',
      value: 8,
      description: 'Comprimento Mínimo da Senha',
      category: 'password',
      type: 'number'
    },
    {
      key: 'require_uppercase',
      value: true,
      description: 'Exigir Letras Maiúsculas',
      category: 'password',
      type: 'boolean'
    },
    {
      key: 'require_numbers',
      value: true,
      description: 'Exigir Números',
      category: 'password',
      type: 'boolean'
    },
    {
      key: 'require_symbols',
      value: false,
      description: 'Exigir Símbolos',
      category: 'password',
      type: 'boolean'
    },
    {
      key: 'max_login_attempts',
      value: 5,
      description: 'Tentativas Máximas de Login',
      category: 'security',
      type: 'number'
    },
    {
      key: 'account_lockout_duration',
      value: 15,
      description: 'Duração do Bloqueio (minutos)',
      category: 'security',
      type: 'number'
    },
    {
      key: 'enable_audit_log',
      value: true,
      description: 'Log de Auditoria',
      category: 'security',
      type: 'boolean'
    },
    {
      key: 'enable_ip_whitelist',
      value: false,
      description: 'Lista Branca de IPs',
      category: 'security',
      type: 'boolean'
    },
    {
      key: 'password_expiry_days',
      value: 90,
      description: 'Expiração da Senha (dias)',
      category: 'password',
      type: 'number'
    },
    {
      key: 'encryption_level',
      value: 'AES256',
      description: 'Nível de Criptografia',
      category: 'encryption',
      type: 'select',
      options: ['AES128', 'AES256', 'RSA2048', 'RSA4096']
    }
  ];

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'security');

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings = data.map(item => {
          const defaultSetting = defaultSecuritySettings.find(ds => ds.key === item.key);
          return {
            ...defaultSetting,
            key: item.key,
            value: typeof item.value === 'string' ? JSON.parse(item.value) : item.value,
            description: item.description || defaultSetting?.description || item.key
          } as SecuritySetting;
        });
        setSecuritySettings(loadedSettings);
      } else {
        setSecuritySettings(defaultSecuritySettings);
        await initializeDefaultSettings();
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de segurança:', error);
      setSecuritySettings(defaultSecuritySettings);
    }
  };

  const initializeDefaultSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsToInsert = defaultSecuritySettings.map(setting => ({
        key: setting.key,
        value: JSON.stringify(setting.value),
        description: setting.description,
        category: 'security',
        user_id: user.id
      }));

      const { error } = await supabase
        .from('system_settings')
        .insert(settingsToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao inicializar configurações de segurança:', error);
    }
  };

  const validateSettings = () => {
    const errors: { [key: string]: string } = {};
    
    const sessionTimeout = securitySettings.find(s => s.key === 'session_timeout');
    if (sessionTimeout) {
      try {
        sessionTimeoutSchema.parse(sessionTimeout.value);
      } catch (error) {
        errors.session_timeout = 'Timeout deve estar entre 5 e 1440 minutos';
      }
    }

    const passwordLength = securitySettings.find(s => s.key === 'password_min_length');
    if (passwordLength) {
      try {
        passwordLengthSchema.parse(passwordLength.value);
      } catch (error) {
        errors.password_min_length = 'Comprimento deve estar entre 6 e 128 caracteres';
      }
    }

    const maxAttempts = securitySettings.find(s => s.key === 'max_login_attempts');
    if (maxAttempts) {
      try {
        maxLoginAttemptsSchema.parse(maxAttempts.value);
      } catch (error) {
        errors.max_login_attempts = 'Tentativas devem estar entre 3 e 10';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSecuritySettings = async () => {
    if (!validateSettings()) {
      return;
    }

    setLoading(true);
    try {
      for (const setting of securitySettings) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: JSON.stringify(setting.value) })
          .eq('key', setting.key);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações de segurança salvas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSecuritySettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const renderSettingInput = (setting: SecuritySetting) => {
    const hasError = validationErrors[setting.key];
    
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
          <div className="space-y-1">
            <Input
              type="number"
              value={setting.value}
              onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value) || 0)}
              className={`w-32 ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && (
              <p className="text-xs text-red-500">{hasError}</p>
            )}
          </div>
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
                  {option}
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

  const authSettings = securitySettings.filter(s => s.category === 'authentication');
  const passwordSettings = securitySettings.filter(s => s.category === 'password');
  const generalSecuritySettings = securitySettings.filter(s => s.category === 'security');
  const encryptionSettings = securitySettings.filter(s => s.category === 'encryption');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações de Segurança</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Autenticação e Sessão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {authSettings.map((setting) => (
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
            <Lock className="h-5 w-5" />
            Políticas de Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSettings.map((setting) => (
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
            <AlertTriangle className="h-5 w-5" />
            Segurança Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generalSecuritySettings.map((setting) => (
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
            <Eye className="h-5 w-5" />
            Criptografia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {encryptionSettings.map((setting) => (
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

      <Button onClick={saveSecuritySettings} disabled={loading} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {loading ? 'Salvando...' : 'Salvar Configurações de Segurança'}
      </Button>
    </div>
  );
};
