
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  company: any;
  refresh: () => void;
}

export function CompanySettingsForm({ company, refresh }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: company?.name || "",
    subdomain: company?.subdomain || "",
    billing_email: company?.billing_email || "",
    logo_url: company?.logo_url || "",
    primary_color: company?.primary_color || "#2563eb",
    secondary_color: company?.secondary_color || "#1e40af",
  });
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setSaving(true);
    const filename = `company-logos/${company.id}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("public-company-logos")
      .upload(filename, file, { upsert: true });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false);
      return;
    }
    const url = supabase.storage.from("public-company-logos").getPublicUrl(filename).data.publicUrl;
    setFormData(f => ({ ...f, logo_url: url }));
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('companies').update(formData).eq('id', company.id);
      if (error) throw error;
      toast({ title: "Salvo", description: "Empresa atualizada." });
      refresh();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Subdomínio</Label>
          <Input value={formData.subdomain} onChange={e => setFormData(f => ({ ...f, subdomain: e.target.value }))} />
        </div>
        <div>
          <Label>E-mail de Cobrança</Label>
          <Input value={formData.billing_email} onChange={e => setFormData(f => ({ ...f, billing_email: e.target.value }))} />
        </div>
        <div>
          <Label>Logo</Label>
          <Input type="file" accept="image/*" onChange={handleFileUpload} />
          {formData.logo_url && <img src={formData.logo_url} alt="Logo" className="h-12 mt-2" />}
        </div>
        <div className="flex gap-4">
          <div>
            <Label>Cor Primária</Label>
            <Input type="color" value={formData.primary_color} onChange={e => setFormData(f => ({ ...f, primary_color: e.target.value }))} />
          </div>
          <div>
            <Label>Cor Secundária</Label>
            <Input type="color" value={formData.secondary_color} onChange={e => setFormData(f => ({ ...f, secondary_color: e.target.value }))} />
          </div>
        </div>
        <Button disabled={saving} onClick={handleSave} className="w-full">{saving ? "Salvando..." : "Salvar alterações"}</Button>
      </CardContent>
    </Card>
  )
}
