
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MarkupSettings {
  id?: string;
  company_id: string;
  fixed_expenses_percentage: number;
  variable_expenses_percentage: number;
  default_profit_margin: number;
}

export const useMarkupSettings = () => {
  const [settings, setSettings] = useState<MarkupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Pega company_id do usuário logado via profiles
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.company_id) throw new Error("ID de empresa não localizado.");
      const { data, error } = await supabase
        .from("markup_settings")
        .select("*")
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (error) throw error;

      setSettings(data || null);
    } catch (err: any) {
      toast({ title: "Erro", description: String(err.message || err), variant: "destructive" });
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (fields: Partial<MarkupSettings>) => {
    try {
      if (!settings?.company_id) throw new Error("ID de empresa não localizado.");
      let resp;
      if (settings.id) {
        resp = await supabase
          .from("markup_settings")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", settings.id)
          .select()
          .single();
      } else {
        resp = await supabase
          .from("markup_settings")
          .insert({
            ...fields,
            company_id: settings.company_id,
          })
          .select()
          .single();
      }
      if (resp.error) throw resp.error;
      setSettings(resp.data);
      toast({ title: "Configurações salvas com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro", description: String(err.message || err), variant: "destructive" });
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  return { settings, loading, fetchSettings, saveSettings };
};
