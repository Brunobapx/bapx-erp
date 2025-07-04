import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
  company_id: string;
}

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadInvitations = async () => {
    if (!companyInfo?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('company_id', companyInfo.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar convites:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (email: string, role: string) => {
    if (!companyInfo?.id) {
      toast({
        title: "Erro",
        description: "Informações da empresa não disponíveis",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Verificar se já existe convite para este email
      const { data: existing } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', email)
        .eq('company_id', companyInfo.id)
        .eq('status', 'pending')
        .single();

      if (existing) {
        toast({
          title: "Erro",
          description: "Já existe um convite pendente para este email",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('user_invitations')
        .insert({
          email,
          role: role as any,
          company_id: companyInfo.id,
          invited_by: (await supabase.auth.getUser()).data.user?.id || '',
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite criado com sucesso!",
      });

      await loadInvitations();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar convite",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite cancelado com sucesso!",
      });

      await loadInvitations();
    } catch (error: any) {
      console.error('Erro ao cancelar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar convite",
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite reenviado com sucesso!",
      });

      await loadInvitations();
    } catch (error: any) {
      console.error('Erro ao reenviar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao reenviar convite",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (companyInfo?.id) {
      loadInvitations();
    }
  }, [companyInfo?.id]);

  return {
    invitations,
    loading,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    loadInvitations
  };
};