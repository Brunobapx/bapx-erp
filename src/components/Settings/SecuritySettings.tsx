
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Shield, Key } from 'lucide-react';
import { z } from 'zod';

// Input validation schemas
const sessionTimeoutSchema = z.number().min(5).max(1440); // 5 minutes to 24 hours
const passwordLengthSchema = z.number().min(6).max(128);

export const SecuritySettings = () => {
  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 30,
    enable_two_factor: false,
    password_min_length: 8,
    require_uppercase: true,
    require_numbers: true,
    require_symbols: false
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ sessionTimeout?: string; passwordLength?: string }>({});
  const { toast } = useToast();

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

      if (data?.length > 0) {
        const sessionTimeoutSetting = data.find(s => s.key === 'session_timeout');
        if (sessionTimeoutSetting) {
          setSecuritySettings(prev => ({
            ...prev,
            session_timeout: typeof sessionTimeoutSetting.value === 'string' 
              ? JSON.parse(sessionTimeoutSetting.value) 
              : sessionTimeoutSetting.value
          }));
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao carregar configurações de segurança:', error);
      }
    }
  };

  const validateSettings = () => {
    const errors: { sessionTimeout?: string; passwordLength?: string } = {};
    
    try {
      sessionTimeoutSchema.parse(securitySettings.session_timeout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.sessionTimeout = 'Timeout deve estar entre 5 e 1440 minutos';
      }
    }

    try {
      passwordLengthSchema.parse(securitySettings.password_min_length);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.passwordLength = 'Comprimento deve estar entre 6 e 128 caracteres';
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
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(securitySettings.session_timeout) })
        .eq('key', 'session_timeout');

      if (error) throw error;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações de Segurança</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Autenticação e Sessão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Timeout da Sessão (minutos)</Label>
              <p className="text-sm text-muted-foreground">
                Tempo limite para sessões inativas (5-1440 min)
              </p>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                value={securitySettings.session_timeout}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  session_timeout: parseInt(e.target.value) || 30
                }))}
                className={`w-24 ${validationErrors.sessionTimeout ? 'border-red-500' : ''}`}
                min="5"
                max="1440"
              />
              {validationErrors.sessionTimeout && (
                <p className="text-xs text-red-500">{validationErrors.sessionTimeout}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Autenticação de Dois Fatores</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar 2FA para todos os usuários
              </p>
            </div>
            <Switch
              checked={securitySettings.enable_two_factor}
              onCheckedChange={(checked) => setSecuritySettings(prev => ({
                ...prev,
                enable_two_factor: checked
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Políticas de Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Comprimento Mínimo</Label>
              <p className="text-sm text-muted-foreground">
                Número mínimo de caracteres (6-128)
              </p>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                value={securitySettings.password_min_length}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  password_min_length: parseInt(e.target.value) || 8
                }))}
                className={`w-24 ${validationErrors.passwordLength ? 'border-red-500' : ''}`}
                min="6"
                max="128"
              />
              {validationErrors.passwordLength && (
                <p className="text-xs text-red-500">{validationErrors.passwordLength}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir Maiúsculas</Label>
              <p className="text-sm text-muted-foreground">
                Senha deve conter letras maiúsculas
              </p>
            </div>
            <Switch
              checked={securitySettings.require_uppercase}
              onCheckedChange={(checked) => setSecuritySettings(prev => ({
                ...prev,
                require_uppercase: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir Números</Label>
              <p className="text-sm text-muted-foreground">
                Senha deve conter números
              </p>
            </div>
            <Switch
              checked={securitySettings.require_numbers}
              onCheckedChange={(checked) => setSecuritySettings(prev => ({
                ...prev,
                require_numbers: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir Símbolos</Label>
              <p className="text-sm text-muted-foreground">
                Senha deve conter caracteres especiais
              </p>
            </div>
            <Switch
              checked={securitySettings.require_symbols}
              onCheckedChange={(checked) => setSecuritySettings(prev => ({
                ...prev,
                require_symbols: checked
              }))}
            />
          </div>

          <Button onClick={saveSecuritySettings} disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Configurações de Segurança'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
