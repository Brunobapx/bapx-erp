import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
}

const fetchTechnicians = async (): Promise<Technician[]> => {
  const { data, error } = await supabase.rpc('get_technicians');
  
  if (error) {
    console.error('Error fetching technicians:', error);
    throw new Error(error.message);
  }
  
  return (data || []).map((user: any) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    full_name: `${user.first_name} ${user.last_name}`.trim()
  }));
};

export const useTechnicians = () => {
  const { user } = useAuth();
  
  return useQuery<Technician[], Error>({
    queryKey: ['technicians'],
    queryFn: fetchTechnicians,
    enabled: !!user,
  });
};