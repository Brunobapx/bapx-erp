
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityConfig {
  sessionTimeout: number;
  enableTwoFactor: boolean;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxLoginAttempts: number;
  accountLockoutDuration: number;
  enableAuditLog: boolean;
  passwordExpiryDays: number;
}

export const useSecuritySettings = () => {
  const [config, setConfig] = useState<SecurityConfig>({
    sessionTimeout: 30,
    enableTwoFactor: false,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: false,
    maxLoginAttempts: 5,
    accountLockoutDuration: 15,
    enableAuditLog: true,
    passwordExpiryDays: 90,
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('category', 'security');

      if (error) throw error;

      if (data && data.length > 0) {
        const settings: Partial<SecurityConfig> = {};
        data.forEach(item => {
          const key = item.key as keyof SecurityConfig;
          const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
          (settings as any)[key] = value;
        });
        setConfig(prev => ({ ...prev, ...settings }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de segurança:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de segurança",
        variant: "destructive",
      });
    }
  };

  const updateSecuritySetting = async (key: keyof SecurityConfig, value: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Validações de segurança
      if (key === 'sessionTimeout' && (value < 5 || value > 1440)) {
        throw new Error('Timeout deve estar entre 5 e 1440 minutos');
      }
      
      if (key === 'passwordMinLength' && (value < 8 || value > 128)) {
        throw new Error('Comprimento da senha deve estar entre 8 e 128 caracteres');
      }
      
      if (key === 'maxLoginAttempts' && (value < 3 || value > 10)) {
        throw new Error('Tentativas de login devem estar entre 3 e 10');
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: key,
          value: JSON.stringify(value),
          category: 'security',
          description: `Configuração de segurança: ${key}`,
        });

      if (error) throw error;

      // Log da alteração de configuração
      await supabase.rpc('log_security_event', {
        action_name: 'SECURITY_SETTING_UPDATED',
        table_name: 'system_settings',
        record_id: null,
        old_data: { [key]: config[key] },
        new_data: { [key]: value }
      });

      setConfig(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Sucesso",
        description: "Configuração de segurança atualizada com sucesso",
      });

    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configuração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < config.passwordMinLength) {
      errors.push(`Senha deve ter pelo menos ${config.passwordMinLength} caracteres`);
    }
    
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }
    
    if (config.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um símbolo especial');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    config,
    loading,
    updateSecuritySetting,
    validatePassword,
    refreshSettings: loadSecuritySettings
  };
};
