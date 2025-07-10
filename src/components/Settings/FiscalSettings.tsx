import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Save, ExternalLink } from 'lucide-react';

export const FiscalSettings = () => {
  const [settings, setSettings] = useState({
    focus_nfe_token: '',
    focus_nfe_environment: 'homologacao',
    focus_nfe_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['focus_nfe_token', 'focus_nfe_environment', 'focus_nfe_enabled']);

      if (error) throw error;

      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = JSON.parse(setting.value as string);
        return acc;
      }, {} as Record<string, any>);

      setSettings({
        focus_nfe_token: settingsMap.focus_nfe_token || '',
        focus_nfe_environment: settingsMap.focus_nfe_environment || 'homologacao',
        focus_nfe_enabled: settingsMap.focus_nfe_enabled || false
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações fiscais');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        category: 'fiscal'
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success('Configurações fiscais salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações fiscais');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.focus_nfe_token) {
      toast.error('Token Focus NFe é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = settings.focus_nfe_environment === 'producao' 
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';

      const response = await fetch(`${baseUrl}/v2/empresas`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(settings.focus_nfe_token + ':')
        }
      });

      if (response.ok) {
        toast.success('Conexão com Focus NFe estabelecida com sucesso!');
      } else {
        toast.error('Erro na conexão com Focus NFe. Verifique o token.');
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com Focus NFe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Configurações Fiscais - Focus NFe
        </CardTitle>
        <CardDescription>
          Configure a integração com Focus NFe para emissão automática de notas fiscais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="focus_nfe_enabled"
              checked={settings.focus_nfe_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, focus_nfe_enabled: checked }))
              }
            />
            <Label htmlFor="focus_nfe_enabled">Habilitar emissão via Focus NFe</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus_nfe_environment">Ambiente</Label>
            <Select 
              value={settings.focus_nfe_environment} 
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, focus_nfe_environment: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus_nfe_token">Token Focus NFe</Label>
            <Input
              id="focus_nfe_token"
              type="password"
              value={settings.focus_nfe_token}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, focus_nfe_token: e.target.value }))
              }
              placeholder="Insira seu token Focus NFe"
            />
            <p className="text-sm text-muted-foreground">
              Para obter seu token, acesse a{' '}
              <a 
                href="https://focusnfe.com.br/painel/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                área do cliente Focus NFe
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={saveSettings} 
            disabled={saving || loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
          <Button 
            variant="outline" 
            onClick={testConnection}
            disabled={loading || !settings.focus_nfe_token}
          >
            {loading ? 'Testando...' : 'Testar Conexão'}
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Informações importantes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use sempre o ambiente de homologação para testes</li>
            <li>• Certifique-se de que os dados da empresa estão completos</li>
            <li>• O token é fornecido pela Focus NFe no painel administrativo</li>
            <li>• A emissão de NFe é assíncrona - aguarde o processamento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};