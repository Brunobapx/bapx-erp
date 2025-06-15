
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SecuritySetting {
  key: string;
  value: any;
  description: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

const sessionTimeoutSchema = z.number().min(5).max(1440);
const passwordLengthSchema = z.number().min(6).max(128);
const maxLoginAttemptsSchema = z.number().min(3).max(10);

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

export const useSecuritySettings = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSecuritySettings();
    // eslint-disable-next-line
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
    if (!validateSettings()) return;

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

  return {
    securitySettings,
    setSecuritySettings,
    loading,
    validationErrors,
    saveSecuritySettings,
    handleSettingChange,
    defaultSecuritySettings,
  };
};
