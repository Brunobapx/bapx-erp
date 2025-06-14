
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSaasPlans } from '@/hooks/useSaasPlans';

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  billing_email?: string;
  onboarded_at?: string;
  trial_expires_at?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface CreateCompanyData {
  name: string;
  subdomain: string;
  billing_email: string;
  plan_id: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name: string;
}

export const useSaasCompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCompanyPlan, setCurrentCompanyPlan] = useState<string>('');
  const { toast } = useToast();
  const { plans } = useSaasPlans();

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCompanies(data || []);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar empresas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCompany = useCallback(async (formData: CreateCompanyData) => {
    // Validação básica
    if (!formData.name || !formData.subdomain || !formData.admin_email || !formData.admin_password || !formData.plan_id) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return null;
    }
    try {
      // Checar subdomínio/email duplicado
      const orConditions = [`subdomain.eq.${formData.subdomain}`];
      if (formData.billing_email && formData.billing_email.trim() !== '') {
        orConditions.push(`billing_email.eq.${formData.billing_email}`);
      }
      
      const { data: existing, error: existingError } = await supabase
        .from('companies')
        .select('id')
        .or(orConditions.join(','))
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        toast({ title: 'Erro', description: 'Já existe uma empresa com esse subdomínio ou email de cobrança.', variant: 'destructive' });
        return null;
      }
      // 1. Criar empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          subdomain: formData.subdomain,
          billing_email: formData.billing_email,
          logo_url: formData.logo_url,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          onboarded_at: new Date().toISOString(),
          trial_expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        })
        .select()
        .single();
      if (companyError || !company) throw companyError || new Error('Erro ao criar empresa');
      // 2. Criar usuário administrador
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: formData.admin_email,
        password: formData.admin_password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.admin_first_name,
          last_name: formData.admin_last_name,
        }
      });
      if (authError || !authUser?.user) {
        await supabase.from('companies').delete().eq('id', company.id);
        throw authError || new Error('Erro ao criar usuário');
      }
      // 3. Criar perfil
      await supabase.from('profiles').insert({
        id: authUser.user.id,
        first_name: formData.admin_first_name,
        last_name: formData.admin_last_name,
        company_id: company.id,
        role: 'admin',
      });
      // 4. Atribuir role admin
      await supabase.from('user_roles').insert({
        user_id: authUser.user.id,
        role: 'admin',
        company_id: company.id,
      });
      // 5. Ativar assinatura
      await supabase.from('company_subscriptions').insert({
        company_id: company.id,
        plan_id: formData.plan_id,
        status: 'active',
        starts_at: new Date().toISOString(),
      });
      toast({ title: 'Sucesso', description: 'Empresa e usuário administrador criados!' });
      await loadCompanies();
      return company;
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || String(err), variant: 'destructive' });
      return null;
    }
  }, [toast, loadCompanies]);

  const updateCompany = async (id: string, companyData: Partial<Company>) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso!",
      });

      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar empresa",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Nova função deleteCompany usando a função SQL de cascade
  const deleteCompany = async (id: string) => {
    try {
      // Chama a função em cascade criada no SQL
      const { error } = await supabase.rpc("delete_company_and_related", { _company_id: id });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa e todos os dados relacionados excluídos com sucesso!",
      });

      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir empresa",
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleCompanyStatus = async (companyId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: newStatus })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Empresa ${newStatus ? 'ativada' : 'desativada'} com sucesso!`,
      });

      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar empresa",
        variant: "destructive",
      });
    }
  };

  return {
    companies,
    loading,
    loadCompanies,
    createCompany,
    currentCompanyPlan,
    setCurrentCompanyPlan,
    plans,
    setCompanies,
    deleteCompany
  };
};
