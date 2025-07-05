import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export type DepartmentType = 
  | 'financeiro'
  | 'vendas' 
  | 'producao'
  | 'compras'
  | 'estoque'
  | 'rh'
  | 'ti'
  | 'diretoria'
  | 'administrativo';

export interface UserDepartment {
  id: string;
  user_id: string;
  department: DepartmentType;
  created_at: string;
  updated_at: string;
}

export const useUserDepartments = () => {
  const [departments, setDepartments] = useState<UserDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadUserDepartments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_departments')
        .select('*')
        .eq('user_id', user.id)
        .order('department');

      if (error) throw error;

      setDepartments(data || []);
    } catch (error: any) {
      console.error('[useUserDepartments] Erro ao carregar departamentos:', error);
      const errorMessage = error.message || "Erro ao carregar departamentos";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async (department: DepartmentType) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('user_departments')
        .insert([{
          user_id: user.id,
          department
        }])
        .select()
        .single();

      if (error) throw error;

      await loadUserDepartments();
      toast({
        title: "Sucesso",
        description: "Departamento adicionado com sucesso!",
      });

      return data;
    } catch (error: any) {
      console.error('[useUserDepartments] Erro ao adicionar departamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar departamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeDepartment = async (departmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_departments')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;

      await loadUserDepartments();
      toast({
        title: "Sucesso",
        description: "Departamento removido com sucesso!",
      });
    } catch (error: any) {
      console.error('[useUserDepartments] Erro ao remover departamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover departamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const hasAccess = (requiredDepartment: DepartmentType): boolean => {
    return departments.some(dept => dept.department === requiredDepartment);
  };

  const getUserDepartments = (): DepartmentType[] => {
    return departments.map(dept => dept.department);
  };

  useEffect(() => {
    loadUserDepartments();
  }, [user]);

  return {
    departments,
    loading,
    error,
    loadUserDepartments,
    addDepartment,
    removeDepartment,
    hasAccess,
    getUserDepartments,
  };
};