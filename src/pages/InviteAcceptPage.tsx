import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  company_id: string;
  expires_at: string;
  status: string;
}

export const InviteAcceptPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });

  const inviteId = searchParams.get('invite');

  useEffect(() => {
    if (inviteId) {
      loadInvitation();
    } else {
      setLoading(false);
    }
  }, [inviteId]);

  const loadInvitation = async () => {
    if (!inviteId) return;

    try {
      console.log('Loading invitation with ID:', inviteId);
      
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .maybeSingle();

      console.log('Invitation data:', data, 'Error:', error);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        toast({
          title: "Convite não encontrado",
          description: "Este convite não existe ou já foi utilizado",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Verificar se não expirou
      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: "Convite Expirado",
          description: "Este convite já expirou. Solicite um novo convite.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      setInvitation(data);
    } catch (error: any) {
      console.error('Erro ao carregar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convite: " + (error.message || 'Erro desconhecido'),
        variant: "destructive",
      });
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Erro",
        description: "Sobrenome é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      console.log('Starting user creation process...');

      // Verificar se o email já está em uso
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(invitation.email);
      if (existingUser) {
        throw new Error('Este email já possui uma conta cadastrada');
      }

      // Criar usuário no Auth
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      console.log('Auth user created:', authData.user.id);

      // Aguardar um momento para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Usar uma transação para criar perfil e role
      const { error: transactionError } = await supabase.rpc('create_user_profile_and_role', {
        p_user_id: authData.user.id,
        p_first_name: formData.firstName,
        p_last_name: formData.lastName,
        p_company_id: invitation.company_id,
        p_role: invitation.role,
        p_invitation_id: invitation.id
      });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        // Se a função não existir, fazer manualmente
        await createProfileAndRoleManually(authData.user.id);
      }

      console.log('User creation completed successfully');

      toast({
        title: "Sucesso!",
        description: "Conta criada com sucesso! Faça login para continuar.",
      });

      navigate('/auth');

    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      
      let errorMessage = "Erro ao criar conta";
      if (error.message?.includes('Email already')) {
        errorMessage = "Este email já possui uma conta cadastrada";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Senha muito fraca. Use pelo menos 8 caracteres";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const createProfileAndRoleManually = async (userId: string) => {
    if (!invitation) return;

    console.log('Creating profile and role manually...');

    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_id: invitation.company_id,
        is_active: true
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Erro ao criar perfil: ' + profileError.message);
    }

    // Criar role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: invitation.role as any,
        company_id: invitation.company_id
      });

    if (roleError) {
      console.error('Role error:', roleError);
      throw new Error('Erro ao criar permissões: ' + roleError.message);
    }

    // Marcar convite como aceito
    const { error: inviteError } = await supabase
      .from('user_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (inviteError) {
      console.error('Invite update error:', inviteError);
      // Não bloquear o processo se não conseguir atualizar o convite
    }

    console.log('Profile and role created successfully');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>
              Este convite não é válido ou já foi utilizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>
            Você foi convidado para {invitation.email}
            <br />
            Complete seu cadastro para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                minLength={8}
                placeholder="Confirme sua senha"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAcceptPage;