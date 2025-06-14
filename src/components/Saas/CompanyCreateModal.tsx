
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
  const { createCompany, plans, loading } = useSaasCompanyManagement();
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '', subdomain: '', billing_email: '', plan_id: '',
    logo_url: '', primary_color: '', secondary_color: '',
    admin_email: '', admin_password: '', admin_first_name: '', admin_last_name: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    const company = await createCompany(formData);
    if (company) setOpen(false);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo Empresa</Button>
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
              <Input value={formData.name} onChange={e => setFormData(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label>Subdomínio *</Label>
              <Input value={formData.subdomain} onChange={e => setFormData(s => ({ ...s, subdomain: e.target.value }))} />
            </div>
            <div>
              <Label>E-mail Cobrança</Label>
              <Input value={formData.billing_email} onChange={e => setFormData(s => ({ ...s, billing_email: e.target.value }))} />
            </div>
            <div>
              <Label>Plano *</Label>
              <Select value={formData.plan_id} onValueChange={v => setFormData(s => ({ ...s, plan_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
              <Input value={formData.admin_first_name} onChange={e => setFormData(s => ({ ...s, admin_first_name: e.target.value }))} />
            </div>
            <div>
              <Label>Sobrenome *</Label>
              <Input value={formData.admin_last_name} onChange={e => setFormData(s => ({ ...s, admin_last_name: e.target.value }))} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input value={formData.admin_email} onChange={e => setFormData(s => ({ ...s, admin_email: e.target.value }))} />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input value={formData.admin_password} type="password" onChange={e => setFormData(s => ({ ...s, admin_password: e.target.value }))} />
            </div>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={saving || loading}>{saving ? "Criando..." : "Criar Empresa"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
