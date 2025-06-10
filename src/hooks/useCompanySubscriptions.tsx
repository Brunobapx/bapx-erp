
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanySubscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  companies?: {
    name: string;
    subdomain: string;
  };
  saas_plans?: {
    name: string;
    price: number;
  };
}

export const useCompanySubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<CompanySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          companies:company_id(name, subdomain),
          saas_plans:plan_id(name, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar assinaturas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (subscriptionData: {
    company_id: string;
    plan_id: string;
    status?: string;
    expires_at?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('company_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura criada com sucesso!",
      });

      loadSubscriptions();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar assinatura",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSubscription = async (id: string, subscriptionData: Partial<CompanySubscription>) => {
    try {
      const { error } = await supabase
        .from('company_subscriptions')
        .update(subscriptionData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura atualizada com sucesso!",
      });

      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar assinatura",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  return {
    subscriptions,
    loading,
    loadSubscriptions,
    createSubscription,
    updateSubscription,
  };
};
