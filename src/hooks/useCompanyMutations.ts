import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateCompanyData, Company } from '@/types/saas';

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
      console.error("Error from useCreateCompany mutation:", err); // Detailed log
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


// --- UPDATE ---
const updateCompanyFn = async ({ id, formData }: { id: string, formData: Partial<Company> }) => {
  const { error } = await supabase.from('companies').update(formData).eq('id', id);
  if (error) throw error;
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateCompanyFn,
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Empresa atualizada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message || 'Ocorreu um erro ao atualizar a empresa.', variant: 'destructive' });
    }
  });
};


// --- DELETE ---
const deleteCompanyFn = async (id: string) => {
  const { error } = await supabase.rpc("delete_company_and_related", { _company_id: id });
  if (error) {
    // Log detalhadíssimo para Supabase errors
    let msg = error.message;
    if (error.details) msg += " | Detalhes: " + error.details;
    if (error.hint) msg += " | Dica: " + error.hint;
    if (error.code) msg += " | Código: " + error.code;
    // Adiciona um alerta para erros comuns de constraint
    if (msg.includes('violates foreign key constraint')) {
      msg += " (Possível causa: ainda há dados dependentes não removidos ou ordem de deleção incorreta.)";
    }
    throw new Error(msg);
  }
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
      // Mostra erro completo e loga no console para debug
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir empresa. Confira se o usuário é master e se a função/fk está correta.",
        variant: "destructive",
      });
      console.error("Erro detalhado ao excluir empresa (Supabase):", error);
    }
  });
};
