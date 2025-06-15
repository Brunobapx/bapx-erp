
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export type ServiceOrder = {
  id: string;
  os_number: string;
  opened_at: string;
  client_id: string;
  technician_id: string;
  service_type: string;
  description: string;
  priority: string;
  status: string;
  contract_service: boolean;
  service_value: number;
  total_value: number;
  notes?: string;
  receivable_id?: string;
  company_id: string;
};

export type ServiceOrderMaterial = {
  id: string;
  service_order_id: string;
  product_id: string;
  quantity: number;
  unit_value?: number;
  subtotal?: number;
  created_at?: string;
  product?: any;
};

export type ServiceOrderAttachment = {
  id: string;
  service_order_id: string;
  file_url: string;
  file_name?: string;
  uploaded_at?: string;
};

export const useServiceOrders = () => {
  const queryClient = useQueryClient();

  // Fetch all service orders for current user (expand: client and technician)
  const {
    data: orders = [],
    isLoading,
    error,
    refetch
  } = useQuery<ServiceOrder[]>({
    queryKey: ["service_orders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado!");
      const { data, error } = await supabase
        .from("service_orders")
        .select("*")
        .order("opened_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceOrder[];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Create or update service order
  const mutation = useMutation({
    mutationFn: async (order: Partial<ServiceOrder>) => {
      let resp;
      if (order.id) {
        // Update
        resp = await supabase
          .from("service_orders")
          .update(order)
          .eq("id", order.id)
          .select()
          .single();
      } else {
        // Insert
        resp = await supabase
          .from("service_orders")
          .insert([order])
          .select()
          .single();
      }
      if (resp.error) throw resp.error;
      return resp.data as ServiceOrder;
    },
    onSuccess: () => {
      toast.success("Ordem de Serviço salva!");
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar OS"),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_orders").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success("Ordem de Serviço excluída!");
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
    }
  });

  return {
    orders,
    isLoading,
    error,
    refetch,
    saveServiceOrder: mutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
  };
};
