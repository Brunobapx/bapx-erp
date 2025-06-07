
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface Vehicle {
  id: string;
  model: string;
  license_plate: string;
  capacity: number;
  status: string;
  driver_name?: string;
  notes?: string;
}

export const useVehicles = () => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar veículos:', error);
      toast.error('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('vehicles')
        .insert([{ ...vehicleData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Veículo cadastrado com sucesso!');
      await fetchVehicles();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar veículo:', error);
      toast.error('Erro ao cadastrar veículo');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async (id: string, vehicleData: Partial<Vehicle>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Veículo atualizado com sucesso!');
      await fetchVehicles();
    } catch (error: any) {
      console.error('Erro ao atualizar veículo:', error);
      toast.error('Erro ao atualizar veículo');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Veículo removido com sucesso!');
      await fetchVehicles();
    } catch (error: any) {
      console.error('Erro ao remover veículo:', error);
      toast.error('Erro ao remover veículo');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    vehicles,
    loading,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle
  };
};
