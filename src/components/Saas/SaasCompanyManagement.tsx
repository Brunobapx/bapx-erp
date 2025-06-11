
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Building, User } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  billing_email?: string;
  onboarded_at?: string;
  trial_expires_at?: string;
}

export const SaasCompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    // Dados da empresa
    name: '',
    subdomain: '',
    billing_email: '',
    // Dados do usuário administrador
    admin_email: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: '',
  });
  const { toast } = useToast();

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    if (!formData.name || !formData.subdomain || !formData.admin_email || !formData.admin_password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // 1. Criar a empresa primeiro
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          subdomain: formData.subdomain,
          billing_email: formData.billing_email,
          onboarded_at: new Date().toISOString(),
          trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias de trial
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Criar o usuário administrador usando Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: formData.admin_email,
        password: formData.admin_password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.admin_first_name,
          last_name: formData.admin_last_name,
        }
      });

      if (authError) {
        // Se falhou ao criar usuário, deletar a empresa criada
        await supabase.from('companies').delete().eq('id', company.id);
        throw authError;
      }

      // 3. Criar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          first_name: formData.admin_first_name,
          last_name: formData.admin_last_name,
          company_id: company.id,
        });

      if (profileError) {
        console.warn('Erro ao criar perfil:', profileError);
        // Não interromper o processo se falhar ao criar perfil
      }

      // 4. Atribuir role de admin ao usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'admin',
          company_id: company.id,
        });

      if (roleError) {
        console.warn('Erro ao atribuir role:', roleError);
        // Não interromper o processo se falhar ao atribuir role
      }

      toast({
        title: "Sucesso",
        description: "Empresa e usuário administrador criados com sucesso!",
      });

      setIsCreateModalOpen(false);
      setFormData({ 
        name: '', 
        subdomain: '', 
        billing_email: '',
        admin_email: '',
        admin_password: '',
        admin_first_name: '',
        admin_last_name: '',
      });
      loadCompanies();

    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar empresa e usuário",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCompanyStatus = async (companyId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: newStatus })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Empresa ${newStatus ? 'ativada' : 'desativada'} com sucesso!`,
      });

      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar empresa",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Building className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Gestão de Empresas</h3>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Dados da Empresa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <h4 className="font-medium">Dados da Empresa</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa *</Label>
                    <Input
                      id="company-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomínio *</Label>
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                      placeholder="empresa1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-email">Email de Cobrança</Label>
                  <Input
                    id="billing-email"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                    placeholder="financeiro@empresa.com"
                  />
                </div>
              </div>

              <Separator />

              {/* Dados do Usuário Administrador */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <h4 className="font-medium">Usuário Administrador</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-first-name">Nome *</Label>
                    <Input
                      id="admin-first-name"
                      value={formData.admin_first_name}
                      onChange={(e) => setFormData({ ...formData, admin_first_name: e.target.value })}
                      placeholder="João"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-last-name">Sobrenome *</Label>
                    <Input
                      id="admin-last-name"
                      value={formData.admin_last_name}
                      onChange={(e) => setFormData({ ...formData, admin_last_name: e.target.value })}
                      placeholder="Silva"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="admin@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha *</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    placeholder="Senha do administrador"
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>
              </div>

              <Button 
                onClick={createCompany} 
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? 'Criando...' : 'Criar Empresa e Administrador'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando empresas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Subdomínio</TableHead>
                  <TableHead>Email Cobrança</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Trial Expira</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.subdomain}</TableCell>
                    <TableCell>{company.billing_email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={company.is_active ? 'default' : 'secondary'}>
                        {company.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {company.trial_expires_at 
                        ? new Date(company.trial_expires_at).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCompanyStatus(company.id, !company.is_active)}
                        >
                          {company.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
