
import { supabase } from "@/integrations/supabase/client";
import { SecuritySetting } from "./useSecuritySettings";

export const loadSecuritySettingsFromDB = async (defaultSecuritySettings: SecuritySetting[]) => {
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
      return loadedSettings;
    } else {
      return defaultSecuritySettings;
    }
  } catch (error) {
    console.error('Erro ao carregar configurações de segurança:', error);
    return defaultSecuritySettings;
  }
};
