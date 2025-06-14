
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building } from "lucide-react";
import { useSaasCompanyManagement, CreateCompanyData } from '@/hooks/useSaasCompanyManagement';
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function CompanyCreateModal({ open, setOpen }: Props) {
  const { createCompany, plans, loading, loadCompanies } = useSaasCompanyManagement();
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '', subdomain: '', billing_email: '', plan_id: '',
    logo_url: '', primary_color: '', secondary_color: '',
    admin_email: '', admin_password: '', admin_first_name: '', admin_last_name: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormFilled =
    formData.name.trim() !== '' &&
    formData.subdomain.trim() !== '' &&
    formData.plan_id.trim() !== '' &&
    formData.admin_email.trim() !== '' &&
    formData.admin_password.trim().length >= 6 &&
    formData.admin_first_name.trim() !== '' &&
    formData.admin_last_name.trim() !== '';

  const handleSubmit = async () => {
    if (!isFormFilled) {
      setError("Preencha todos os campos obrigatórios! A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setSaving(true);
    setError(null);

    const company = await createCompany(formData);
    if (company) {
      setOpen(false);
      setFormData({
        name: '', subdomain: '', billing_email: '', plan_id: '',
        logo_url: '', primary_color: '', secondary_color: '',
        admin_email: '', admin_password: '', admin_first_name: '', admin_last_name: '',
      });
      await loadCompanies();
    } else {
      setError('Não foi possível criar a empresa. Verifique se todos os campos obrigatórios estão preenchidos e se o subdomínio ou email de cobrança já estão em uso.');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova Empresa</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Empresa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2 items-center"><Building className="h-4 w-4" /><b>Dados da Empresa</b></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input
                required
                value={formData.name || ""}
                onChange={e => setFormData(s => ({ ...s, name: e.target.value }))}
                placeholder="Nome da empresa"
              />
            </div>
            <div>
              <Label>Subdomínio *</Label>
              <Input
                required
                value={formData.subdomain || ""}
                onChange={e => setFormData(s => ({ ...s, subdomain: e.target.value }))}
                placeholder="subdominio"
              />
            </div>
            <div>
              <Label>E-mail Cobrança</Label>
              <Input
                value={formData.billing_email || ""}
                onChange={e => setFormData(s => ({ ...s, billing_email: e.target.value }))}
                placeholder="E-mail de cobrança (opcional)"
              />
            </div>
            <div>
              <Label>Plano *</Label>
              <Select
                value={formData.plan_id || ""}
                onValueChange={v => setFormData(s => ({ ...s, plan_id: v }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {plans && plans.filter(p=>p.is_active).map(plan=>(
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toFixed(2)} ({plan.billing_cycle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex gap-2 items-center"><User className="h-4 w-4" /><b>Admin da Empresa</b></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input
                required
                value={formData.admin_first_name || ""}
                onChange={e => setFormData(s => ({ ...s, admin_first_name: e.target.value }))}
                placeholder="Primeiro nome"
              />
            </div>
            <div>
              <Label>Sobrenome *</Label>
              <Input
                required
                value={formData.admin_last_name || ""}
                onChange={e => setFormData(s => ({ ...s, admin_last_name: e.target.value }))}
                placeholder="Sobrenome"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                required
                value={formData.admin_email || ""}
                onChange={e => setFormData(s => ({ ...s, admin_email: e.target.value }))}
                placeholder="E-mail do administrador"
                type="email"
              />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input
                required
                value={formData.admin_password || ""}
                type="password"
                onChange={e => setFormData(s => ({ ...s, admin_password: e.target.value }))}
                minLength={6}
                placeholder="Senha (mínimo 6 caracteres)"
              />
            </div>
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!isFormFilled || saving || loading}
            type="button"
          >
            {saving ? "Criando..." : "Criar Empresa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
