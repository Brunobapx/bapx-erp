import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSaasPlans } from "@/hooks/useSaasPlans";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";

interface Props {
  company: any;
  refresh: () => void;
}

const fetchCompanySubscription = async (companyId: string) => {
    const { data, error } = await supabase
        .from('company_subscriptions')
        .select('plan_id')
        .eq('company_id', companyId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();
    if (error) {
        console.error("Error fetching subscription:", error);
        throw error;
    }
    return data;
};

const updateCompanyDetails = async ({ companyId, formData }: { companyId: string, formData: any }) => {
    const { error } = await supabase.from('companies').update(formData).eq('id', companyId);
    if (error) throw error;
};

const updateCompanySubscription = async ({ companyId, planId, currentPlanId }: { companyId: string, planId: string, currentPlanId: string | null }) => {
    if (currentPlanId && planId !== currentPlanId) {
        await supabase
          .from('company_subscriptions')
          .update({ status: 'cancelled', expires_at: new Date().toISOString() })
          .eq('company_id', companyId)
          .eq('plan_id', currentPlanId)
          .in('status', ['active', 'trialing']);
    }
    
    const { error: createError } = await supabase
        .from('company_subscriptions')
        .insert({
            company_id: companyId,
            plan_id: planId,
            status: 'active',
            starts_at: new Date().toISOString(),
        });
    
    if (createError) throw createError;
};

export function CompanySettingsForm({ company, refresh }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: company?.name || "",
    subdomain: company?.subdomain || "",
    billing_email: company?.billing_email || "",
    logo_url: company?.logo_url || "",
    primary_color: company?.primary_color || "#2563eb",
    secondary_color: company?.secondary_color || "#1e40af",
    is_active: company?.is_active ?? true,
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { plans, loading: plansLoading } = useSaasPlans();
  
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
      queryKey: ['companySubscription', company.id],
      queryFn: () => fetchCompanySubscription(company.id),
      enabled: !!company.id,
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        subdomain: company.subdomain || "",
        billing_email: company.billing_email || "",
        logo_url: company.logo_url || "",
        primary_color: company.primary_color || "#2563eb",
        secondary_color: company.secondary_color || "#1e40af",
        is_active: company.is_active ?? true,
      });
    }
    if (currentSubscription) {
      setSelectedPlanId(currentSubscription.plan_id);
    } else {
      setSelectedPlanId(null);
    }
  }, [company, currentSubscription]);

  const updateCompanyMutation = useMutation({
    mutationFn: updateCompanyDetails,
    onSuccess: () => {
        toast({ title: "Salvo", description: "Dados da empresa atualizados." });
        refresh();
    },
    onError: (err: any) => {
        toast({ title: "Erro ao salvar dados", description: err.message, variant: "destructive" });
    }
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: updateCompanySubscription,
    onSuccess: () => {
        toast({ title: "Salvo", description: "Plano da empresa atualizado." });
        queryClient.invalidateQueries({ queryKey: ['companySubscription', company.id] });
        refresh();
    },
    onError: (err: any) => {
        toast({ title: "Erro ao atualizar plano", description: err.message, variant: "destructive" });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingLogo(true);
    const filename = `company-logos/${company.id}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("public-company-logos")
      .upload(filename, file, { upsert: true });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setUploadingLogo(false);
      return;
    }
    const url = supabase.storage.from("public-company-logos").getPublicUrl(filename).data.publicUrl;
    setFormData(f => ({ ...f, logo_url: url }));
    setUploadingLogo(false);
  };

  const handleSave = async () => {
    updateCompanyMutation.mutate({ companyId: company.id, formData });

    if (selectedPlanId && selectedPlanId !== (currentSubscription?.plan_id || null)) {
      updateSubscriptionMutation.mutate({
        companyId: company.id,
        planId: selectedPlanId,
        currentPlanId: currentSubscription?.plan_id || null,
      });
    }
  };

  const isSaving = updateCompanyMutation.isPending || updateSubscriptionMutation.isPending || uploadingLogo;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Empresa: {company?.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="company-status"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
          />
          <Label htmlFor="company-status" className={formData.is_active ? 'text-green-600' : 'text-red-600'}>
            {formData.is_active ? "Empresa Ativa" : "Empresa Inativa"}
          </Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Subdomínio</Label>
            <Input value={formData.subdomain} onChange={e => setFormData(f => ({ ...f, subdomain: e.target.value }))} />
          </div>
        </div>
        <div>
          <Label>E-mail de Cobrança</Label>
          <Input value={formData.billing_email} onChange={e => setFormData(f => ({ ...f, billing_email: e.target.value }))} />
        </div>
        
        <div>
          <Label>Plano</Label>
          <Select
            value={selectedPlanId || ""}
            onValueChange={setSelectedPlanId}
            disabled={plansLoading || subscriptionLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um plano..." />
            </SelectTrigger>
            <SelectContent>
              {plans?.filter(p => p.is_active).map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - R$ {plan.price.toFixed(2)} ({plan.billing_cycle})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Logo</Label>
          <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploadingLogo} />
          {formData.logo_url && <img src={formData.logo_url} alt="Logo" className="h-12 mt-2 rounded border p-1" />}
        </div>

        <div className="flex gap-4">
          <div>
            <Label>Cor Primária</Label>
            <Input type="color" value={formData.primary_color} onChange={e => setFormData(f => ({ ...f, primary_color: e.target.value }))} className="p-1 h-10 w-24" />
          </div>
          <div>
            <Label>Cor Secundária</Label>
            <Input type="color" value={formData.secondary_color} onChange={e => setFormData(f => ({ ...f, secondary_color: e.target.value }))} className="p-1 h-10 w-24" />
          </div>
        </div>
        <Button disabled={isSaving} onClick={handleSave} className="w-full">{isSaving ? "Salvando..." : "Salvar alterações"}</Button>
      </CardContent>
    </Card>
  )
}
