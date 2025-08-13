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

      if (error && error.code !== 'PGRST116') {
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

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('nota_configuracoes')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
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