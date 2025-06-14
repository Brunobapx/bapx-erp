
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CommissionType = "percent" | "fixed" | "inherit";

export interface Commission {
  id: string;
  sale_id: string;
  salesperson_id: string;
  commission_value: number;
  commission_rate: number;
  commission_type: CommissionType;
  is_paid: boolean;
  paid_at?: string;
  created_at?: string;
  sale_number?: string;
  total_amount?: number;
  client_name?: string;
}

export const useCommissions = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("salesperson_commissions")
      .select(`
        *,
        sales(sale_number, total_amount, client_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao buscar comissões");
      setCommissions([]);
    } else {
      setCommissions(
        (data || []).map((item) => ({
          ...item,
          sale_number: item.sales?.sale_number,
          total_amount: item.sales?.total_amount,
          client_name: item.sales?.client_name,
        }))
      );
    }
    setLoading(false);
  };

  const payCommission = async (commissionId: string, paymentMethod?: string, notes?: string) => {
    // Marca como pago e adiciona pagamento à tabela commission_payments
    const { error: payError } = await supabase
      .from("salesperson_commissions")
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", commissionId);

    if (payError) {
      toast.error("Erro ao marcar comissão como paga.");
      return false;
    }

    // Busca a comissão para pegar o valor
    const { data: commissionRow } = await supabase
      .from("salesperson_commissions")
      .select("*")
      .eq("id", commissionId)
      .maybeSingle();

    if (commissionRow) {
      await supabase.from("commission_payments").insert({
        commission_id: commissionId,
        amount: commissionRow.commission_value,
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        notes
      });
    }

    toast.success("Comissão marcada como paga.");
    fetchCommissions();
    return true;
  };

  return { commissions, loading, fetchCommissions, payCommission };
};
