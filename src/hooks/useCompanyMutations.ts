import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateCompanyData } from '@/types/saas';

// --- CREATE ---
const createCompanyFn = async (formData: CreateCompanyData) => {
    const { data, error } = await supabase.functions.invoke('create-company', {
        body: { formData },
    });

    if (error) {
      // O erro da edge function será capturado aqui.
      // Vamos lançá-lo para que o `onError` do `useMutation` possa lidar com ele.
      throw error;
    }
    
    return data.company;
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
      let description = 'Ocorreu um erro ao criar a empresa.';
      
      // Tenta extrair a mensagem de erro do objeto de erro da função
      if (err.context && err.context.error_message) {
        description = err.context.error_message;
      } else if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) {
            description = parsed.error;
          } else {
            description = err.message;
          }
        } catch (e) {
          description = err.message;
        }
      }
      
      toast({ title: 'Erro', description, variant: 'destructive' });
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
