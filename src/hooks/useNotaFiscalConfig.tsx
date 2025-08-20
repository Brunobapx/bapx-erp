import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotaConfig {
  id?: string;
  tipo_nota: string;
  ambiente: string;
  token_focus: string;
  cnpj_emissor: string;
  regime_tributario: string;
  tipo_empresa: string;
  cfop_padrao: string;
  csosn_padrao: string;
  cst_padrao: string;
  icms_percentual: number;
  pis_percentual: number;
  cofins_percentual: number;
}

export const useNotaFiscalConfig = () => {
  const [config, setConfig] = useState<NotaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('nota_configuracoes')
        .select('*')
        .maybeSingle();

      if (error) {
        // PGRST116 = No rows found (OK for maybeSingle)
        if (error.code === 'PGRST116') {
          // No config found, set default values
          setConfig({
            tipo_nota: 'nfe',
            ambiente: 'homologacao',
            token_focus: '',
            cnpj_emissor: '',
            regime_tributario: '1',
            tipo_empresa: 'MEI',
            cfop_padrao: '5101',
            csosn_padrao: '101',
            cst_padrao: '00',
            icms_percentual: 18,
            pis_percentual: 1.65,
            cofins_percentual: 7.6,
          });
          return;
        }
        
        // PGRST301 = RLS policy violation (insufficient permissions)
        if (error.code === 'PGRST301' || error.message?.includes('RLS') || error.message?.includes('policy')) {
          console.error('Acesso negado - apenas administradores podem acessar as configurações de nota fiscal');
          toast.error('Acesso negado: apenas administradores podem gerenciar configurações de nota fiscal');
          setConfig(null);
          return;
        }
        
        throw error;
      }

      setConfig(data || {
        tipo_nota: 'nfe',
        ambiente: 'homologacao',
        token_focus: '',
        cnpj_emissor: '',
        regime_tributario: '1',
        tipo_empresa: 'MEI',
        cfop_padrao: '5101',
        csosn_padrao: '101',
        cst_padrao: '00',
        icms_percentual: 18,
        pis_percentual: 1.65,
        cofins_percentual: 7.6,
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: NotaConfig) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const configData = {
        ...newConfig,
        user_id: user.id,
      };

      if (config?.id) {
        const { error } = await supabase
          .from('nota_configuracoes')
          .update(configData)
          .eq('id', config.id);

        if (error) {
          // Check for RLS policy violation
          if (error.code === 'PGRST301' || error.message?.includes('RLS') || error.message?.includes('policy')) {
            toast.error('Acesso negado: apenas administradores podem gerenciar configurações de nota fiscal');
            return;
          }
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('nota_configuracoes')
          .insert(configData)
          .select()
          .single();

        if (error) {
          // Check for RLS policy violation
          if (error.code === 'PGRST301' || error.message?.includes('RLS') || error.message?.includes('policy')) {
            toast.error('Acesso negado: apenas administradores podem gerenciar configurações de nota fiscal');
            return;
          }
          throw error;
        }
        setConfig({ ...newConfig, id: data.id });
      }

      setConfig(newConfig);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    saving,
    saveConfig,
    setConfig,
  };
};