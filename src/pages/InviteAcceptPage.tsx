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
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast({
          title: "Erro",
          description: "Convite não encontrado ou já foi utilizado",
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
    } catch (error) {
      console.error('Erro ao carregar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convite",
        variant: "destructive",
      });
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Criar usuário
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

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_id: invitation.company_id,
          is_active: true
        });

      if (profileError) throw profileError;

      // Criar role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: invitation.role as any,
          company_id: invitation.company_id
        });

      if (roleError) throw roleError;

      // Marcar convite como aceito
      const { error: inviteError } = await supabase
        .from('user_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso! Faça login para continuar.",
      });

      navigate('/auth');

    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                minLength={8}
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