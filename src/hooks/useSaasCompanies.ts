
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types/saas';

const fetchCompanies = async (): Promise<Company[]> => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_subscriptions (
        status,
        expires_at,
        saas_plans (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching companies:", error);
    throw new Error(error.message);
  }

  return (data as any) as Company[] || [];
};

export const useSaasCompanies = () => {
  return useQuery<Company[], Error>({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });
};
