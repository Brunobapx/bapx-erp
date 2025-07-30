import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserPosition = 'vendedor' | 'administrativo' | 'entregador' | 'gerente' | 'financeiro' | 'producao' | 'estoque' | 'tecnico';

export const POSITION_LABELS: Record<UserPosition, string> = {
  vendedor: 'Vendedor',
  administrativo: 'Administrativo',
  entregador: 'Entregador', 
  gerente: 'Gerente',
  financeiro: 'Financeiro',
  producao: 'Produção',
  estoque: 'Estoque',
  tecnico: 'Técnico'
};

export const useUserPositions = () => {
  const [currentUserPosition, setCurrentUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentUserPosition = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error } = await supabase
        .from('user_positions')
        .select('position')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user position:', error);
        return;
      }

      setCurrentUserPosition(data?.position as UserPosition || null);
    } catch (error) {
      console.error('Error in fetchCurrentUserPosition:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPosition = async (userId: string, position: UserPosition) => {
    try {
      const { error } = await supabase
        .from('user_positions')
        .upsert({
          user_id: userId,
          position,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cargo atualizado com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating user position:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cargo",
        variant: "destructive",
      });
      return false;
    }
  };

  const getUserPosition = async (userId: string): Promise<UserPosition | null> => {
    try {
      const { data, error } = await supabase
        .from('user_positions')
        .select('position')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.position as UserPosition || null;
    } catch (error) {
      console.error('Error getting user position:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchCurrentUserPosition();
  }, []);

  return {
    currentUserPosition,
    loading,
    updateUserPosition,
    getUserPosition,
    refetch: fetchCurrentUserPosition,
    isVendedor: currentUserPosition === 'vendedor',
    isTecnico: currentUserPosition === 'tecnico'
  };
};