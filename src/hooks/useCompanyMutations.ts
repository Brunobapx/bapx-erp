
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateCompanyData } from '@/types/saas';

// --- CREATE ---
const createCompanyFn = async (formData: CreateCompanyData) => {
    // Validação básica
    if (!formData.name || !formData.subdomain || !formData.admin_email || !formData.admin_password || !formData.plan_id) {
      throw new Error('Preencha todos os campos obrigatórios');
    }

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
      throw new Error('Já existe uma empresa com esse subdomínio ou email de cobrança.');
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
    
    try {
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
      if (authError || !authUser?.user) throw authError || new Error('Erro ao criar usuário');
      
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
      
      return company;
    } catch(err) {
      // Rollback company creation if any other step fails
      await supabase.from('companies').delete().eq('id', company.id);
      throw err;
    }
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createCompanyFn,
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Empresa e usuário administrador criados!' });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message || 'Ocorreu um erro ao criar a empresa', variant: 'destructive' });
    }
  });
};


// --- DELETE ---
const deleteCompanyFn = async (id: string) => {
  const { error } = await supabase.rpc("delete_company_and_related", { _company_id: id });
  if (error) throw error;
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteCompanyFn,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Empresa e todos os dados relacionados excluídos com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir empresa",
        variant: "destructive",
      });
    }
  });
};
