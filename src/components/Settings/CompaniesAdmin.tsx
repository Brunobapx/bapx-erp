import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Pencil, Trash2, CreditCard, CalendarDays, Users as UsersIcon, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Company {
  id: string;
  name: string;
  code: string;
  subdomain?: string | null;
  billing_email?: string | null;
  logo_url?: string | null;
  trial_expires_at?: string | null;
}

interface AppUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export const CompaniesAdmin: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    billing_email: '',
    plan_id: 'standard',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_password: '',
  });

  // Assign user state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId) || null, [companies, selectedCompanyId]);
  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.billing_email || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  const loadCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, code, subdomain, billing_email, logo_url, trial_expires_at')
      .order('code');
    setLoading(false);
    if (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar empresas', variant: 'destructive' });
      return;
    }
    setCompanies(data || []);
    if (!selectedCompanyId && data && data.length > 0) {
      setSelectedCompanyId(data[0].id);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-users');
      if (error) throw error;
      const mapped: AppUser[] = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.user_metadata?.first_name,
        last_name: u.user_metadata?.last_name,
      }));
      setUsers(mapped);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      toast({ title: 'Erro', description: 'Falha ao carregar usuários', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadCompanies();
    loadUsers();
  }, []);

  const handleCreateCompany = async () => {
    if (!form.name || !form.subdomain || !form.admin_email || !form.admin_password || !form.admin_first_name || !form.admin_last_name) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: { formData: form },
      });
      setLoading(false);
      if (error) throw error;
      toast({ title: 'Empresa criada', description: 'A empresa foi criada com sucesso.' });
      setCreateOpen(false);
      setForm({ name: '', subdomain: '', billing_email: '', plan_id: 'standard', admin_first_name: '', admin_last_name: '', admin_email: '', admin_password: '' });
      await loadCompanies();
    } catch (err: any) {
      console.error('Erro ao criar empresa:', err);
      toast({ title: 'Erro', description: err?.message || 'Falha ao criar empresa', variant: 'destructive' });
    }
  };

  const handleUpdateCompany = async (company: Company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: company.name, subdomain: company.subdomain, billing_email: company.billing_email })
        .eq('id', company.id);
      if (error) throw error;
      toast({ title: 'Alterações salvas', description: `Empresa ${company.name} atualizada.` });
      await loadCompanies();
    } catch (err: any) {
      console.error('Erro ao atualizar empresa:', err);
      toast({ title: 'Erro', description: err?.message || 'Falha ao salvar', variant: 'destructive' });
    }
  };

  const handleAssignUser = async () => {
    if (!selectedCompanyId || !selectedUserId) {
      toast({ title: 'Seleção inválida', description: 'Selecione empresa e usuário.' });
      return;
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: selectedCompanyId })
        .eq('id', selectedUserId);
      if (error) throw error;
      toast({ title: 'Usuário atribuído', description: 'O usuário foi vinculado à empresa.' });
    } catch (err: any) {
      console.error('Erro ao atribuir usuário:', err);
      toast({ title: 'Erro', description: err?.message || 'Falha ao atribuir', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Empresas</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Localize"
              className="md:w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> ADICIONAR
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar nova empresa</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <div>
                    <Label>Nome</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Subdomínio</Label>
                    <Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email de cobrança</Label>
                    <Input type="email" value={form.billing_email} onChange={(e) => setForm({ ...form, billing_email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Plano</Label>
                    <Input value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })} />
                  </div>
                  <div>
                    <Label>Admin - Nome</Label>
                    <Input value={form.admin_first_name} onChange={(e) => setForm({ ...form, admin_first_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Admin - Sobrenome</Label>
                    <Input value={form.admin_last_name} onChange={(e) => setForm({ ...form, admin_last_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Admin - Email</Label>
                    <Input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Admin - Senha</Label>
                    <Input type="password" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateCompany} disabled={loading}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((c) => {
                    const today = new Date();
                    const venc = c.trial_expires_at ? new Date(c.trial_expires_at) : null;
                    const isExpired = !!(venc && venc < today);
                    const isActive = !venc || !isExpired;
                    const vencStr = venc ? venc.toLocaleDateString('pt-BR') : '—';

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {editingId === c.id ? (
                            <Input
                              value={c.name}
                              onChange={(e) => setCompanies(prev => prev.map(p => p.id === c.id ? { ...p, name: e.target.value } : p))}
                            />
                          ) : (
                            c.name
                          )}
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Ativa</div>
                          ) : (
                            <div className="flex items-center gap-2 text-destructive"><XCircle className="h-4 w-4" /> Inativa</div>
                          )}
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{c.billing_email || '—'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${isExpired ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground'}`}>{vencStr}</span>
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {editingId === c.id ? (
                              <Button size="sm" onClick={() => { setEditingId(null); handleUpdateCompany(c); }}>Salvar</Button>
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" disabled>
                                      <CreditCard className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Financeiro (em breve)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" disabled>
                                      <CalendarDays className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Assinatura/Plano (em breve)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" disabled>
                                      <UsersIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Usuários da empresa (em breve)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => setEditingId(c.id)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" disabled>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Excluir (em breve)</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCompanies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>Nenhuma empresa encontrada.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atribuir usuário a uma empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Empresa</Label>
              <select
                className="border rounded-md h-10 px-3"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Usuário</Label>
              <select
                className="border rounded-md h-10 px-3"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Selecione</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAssignUser} disabled={!selectedCompanyId || !selectedUserId}>Vincular</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
