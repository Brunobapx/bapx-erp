
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const fetchCompanyUsers = async (companyId: string): Promise<CompanyUser[]> => {
  if (!companyId) return [];

  const { data, error } = await supabase.rpc('get_company_users', {
    company_id_param: companyId,
  });

  if (error) {
    console.error('Error fetching company users:', error);
    throw new Error(error.message);
  }
  return data || [];
};

export const useCompanyUsers = (companyId: string | null) => {
  return useQuery<CompanyUser[], Error>({
    queryKey: ['companyUsers', companyId],
    queryFn: () => fetchCompanyUsers(companyId!),
    enabled: !!companyId,
  });
};
