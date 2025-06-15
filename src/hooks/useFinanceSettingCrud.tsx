import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BaseFinanceSetting } from "@/types/financeSetting";

export function useFinanceSettingCrud<T extends BaseFinanceSetting>(
  table: string,
  selectFields = "*"
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.company_id) throw new Error("Empresa não encontrada.");

      const { data, error } = await supabase
        .from(table)
        .select(selectFields)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setItems((data ?? []) as unknown as T[]);
    } catch (err: any) {
      setItems([] as unknown as T[]);
      toast({ title: "Erro", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const upsertItem = async (fields: Partial<T>, id?: string) => {
    setLoading(true);
    try {
      let record;
      if (id) {
        const { data, error } = await supabase
          .from(table)
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        record = data;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile?.company_id) throw new Error("Empresa não encontrada.");
        const { data, error } = await supabase
          .from(table)
          .insert({ ...fields, company_id: profile.company_id })
          .select()
          .single();
        if (error) throw error;
        record = data;
      }
      toast({ title: "Salvo com sucesso", variant: "default" });
      await fetchItems();
      return record;
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || String(err), variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Removido com sucesso", variant: "default" });
      await fetchItems();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [table]);

  return { items, loading, error: null, upsertItem, deleteItem, fetchItems };
}
