
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Building } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    billing_email: '',
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
    try {
      const { data, error } = await supabase
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

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso!",
      });

      setIsCreateModalOpen(false);
      setFormData({ name: '', subdomain: '', billing_email: '' });
      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar empresa",
        variant: "destructive",
      });
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomínio</Label>
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  placeholder="empresa1"
                />
                <p className="text-xs text-muted-foreground">
                  O subdomínio será usado para identificar a empresa no sistema
                </p>
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
              <Button onClick={createCompany} className="w-full">
                Criar Empresa
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
