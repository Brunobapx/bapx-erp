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
  whatsapp?: string | null;
  plan?: string | null;
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
    whatsapp: '',
    trial_expires_at: '',
    plan_id: 'bronze',
    subdomain: '',
    billing_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_password: '',
  });

  // Assign user state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId) || null, [companies, selectedCompanyId]);
  // Users dialog & actions state
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [usersDialogCompany, setUsersDialogCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

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
      .select('id, name, code, subdomain, billing_email, logo_url, trial_expires_at, whatsapp, plan')
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

      // The edge function returns { success, users: [...] }
      const list = Array.isArray((data as any)?.users) ? (data as any).users : Array.isArray(data) ? (data as any) : [];

      const mapped: AppUser[] = list.map((u: any) => ({
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

  // List users for a company using profiles mapping
  const openCompanyUsers = async (company: Company) => {
    try {
      setUsersDialogCompany(company);
      setUsersDialogOpen(true);
      setUsersLoading(true);
      const { data: profilesRows, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', company.id);
      if (error) throw error;
      const ids = (profilesRows || []).map((p: any) => p.id);
      const filtered = users.filter((u) => ids.includes(u.id));
      setCompanyUsers(filtered);
    } catch (err: any) {
      console.error('Erro ao carregar usuários da empresa:', err);
      toast({ title: 'Erro', description: 'Falha ao listar usuários da empresa', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  };

  // Toggle active/inactive by updating trial_expires_at
  const handleToggleActive = async (company: Company) => {
    const venc = company.trial_expires_at ? new Date(company.trial_expires_at) : null;
    const isExpired = !!(venc && venc < new Date());
    const isActive = !venc || !isExpired;
    try {
      const updates = { trial_expires_at: isActive ? new Date(Date.now() - 60 * 1000).toISOString() : null };
      const { error } = await supabase.from('companies').update(updates).eq('id', company.id);
      if (error) throw error;
      toast({ title: isActive ? 'Empresa inativada' : 'Empresa ativada' });
      await loadCompanies();
    } catch (err: any) {
      console.error('Erro ao alterar status da empresa:', err);
      toast({ title: 'Erro', description: err?.message || 'Falha ao alterar status', variant: 'destructive' });
    }
  };

  // Delete a company (with confirmation)
  const handleDeleteCompany = async (company: Company) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir "${company.name}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('companies').delete().eq('id', company.id);
      setLoading(false);
      if (error) throw error;
      toast({ title: 'Empresa excluída', description: `${company.name} foi removida.` });
      await loadCompanies();
    } catch (err: any) {
      console.error('Erro ao excluir empresa:', err);
      toast({ title: 'Erro', description: err?.message || 'Falha ao excluir', variant: 'destructive' });
    }
  };
  const handleCreateCompany = async () => {
    if (!form.name || !form.admin_email || !form.admin_password || !form.admin_first_name) {
      toast({ title: 'Campos obrigatórios', description: 'Informe Nome da empresa, Nome do responsável, E-mail e Senha.', variant: 'destructive' });
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
      setForm({ name: '', whatsapp: '', trial_expires_at: '', plan_id: 'bronze', subdomain: '', billing_email: '', admin_first_name: '', admin_last_name: '', admin_email: '', admin_password: '' });
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
                  <DialogTitle>Cadastrar Empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-2">
                  <div className="rounded-lg border p-4">
                    <p className="font-semibold mb-3">Informações</p>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Whatsapp</Label>
                        <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(00) 00000-0000" />
                      </div>
                      <div>
                        <Label>Data/Hora Vencimento</Label>
                        <Input type="datetime-local" value={form.trial_expires_at} onChange={(e) => setForm({ ...form, trial_expires_at: e.target.value })} />
                      </div>
                      <div>
                        <Label>Plano</Label>
                        <select className="border rounded-md h-10 px-3" value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })}>
                          <option value="bronze">Bronze</option>
                          <option value="prata">Prata</option>
                          <option value="ouro">Ouro</option>
                          <option value="diamante">Diamante</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="font-semibold mb-3">Cadastrar Usuário Responsável</p>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input value={form.admin_first_name} onChange={(e) => setForm({ ...form, admin_first_name: e.target.value })} />
                      </div>
                      <div>
                        <Label>E-mail</Label>
                        <Input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
                      </div>
                      <div>
                        <Label>Senha</Label>
                        <Input type="password" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateCompany} disabled={loading}>Salvar</Button>
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
                        <TableCell>{c.whatsapp || '—'}</TableCell>
                        <TableCell>{c.billing_email || '—'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${isExpired ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground'}`}>{vencStr}</span>
                        </TableCell>
                        <TableCell>{c.plan || '—'}</TableCell>
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
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleActive(c)}>
                                      <CalendarDays className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{isActive ? 'Inativar empresa' : 'Ativar empresa'}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => openCompanyUsers(c)}>
                                      <UsersIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Usuários da empresa</TooltipContent>
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
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteCompany(c)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Excluir</TooltipContent>
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

      {/* Users dialog */}
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuários de {usersDialogCompany?.name || ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {usersLoading ? (
              <p>Carregando...</p>
            ) : companyUsers.length > 0 ? (
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || '—'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum usuário vinculado a esta empresa.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setUsersDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
