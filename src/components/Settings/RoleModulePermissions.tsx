
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "administrativo", label: "Administrativo" },
  { value: "financeiro", label: "Financeiro" },
  { value: "producao", label: "Produção" },
  { value: "embalagem", label: "Embalagem" },
  { value: "entrega", label: "Entrega" },
  { value: "user", label: "Usuário" },
];

interface SaasModule {
  id: string;
  name: string;
  route_path: string;
  category: string;
  is_core: boolean;
}

interface PermissionRow {
  id?: string;
  role: string;
  module_id: string;
  can_access: boolean;
}

export const RoleModulePermissions = () => {
  const [modules, setModules] = useState<SaasModule[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, PermissionRow>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Carrega módulos e permissões
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Busca todos os módulos
      const { data: modulesData } = await supabase
        .from("saas_modules")
        .select("*")
        .order("category", { ascending: true });

      // Busca todas as permissões
      const { data: permsData } = await supabase
        .from("user_role_permissions")
        .select("*");

      // A estrutura vai ficar: permissions[role][module_id] = { ...row }
      const perms: Record<string, Record<string, PermissionRow>> = {};
      for (const roleInfo of ROLES) {
        perms[roleInfo.value] = {};
        for (const mod of modulesData || []) {
          // Prioriza a permissão encontrada, senão core default true, senão false
          const found = permsData?.find(
            (pr) => pr.role === roleInfo.value && pr.module_id === mod.id
          );
          perms[roleInfo.value][mod.id] = {
            id: found?.id,
            role: roleInfo.value,
            module_id: mod.id,
            can_access: mod.is_core ? true : found?.can_access ?? false,
          };
        }
      }
      setModules(modulesData || []);
      setPermissions(perms);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (role: string, module: SaasModule, checked: boolean) => {
    // Prevent toggle if core
    if (module.is_core) return;

    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module.id]: {
          ...prev[role][module.id],
          can_access: checked,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Para cada role/module salva/apaga conforme checked
      for (const roleInfo of ROLES) {
        for (const mod of modules) {
          // Ignora core: sempre true e não editável
          if (mod.is_core) continue;

          const perm = permissions[roleInfo.value][mod.id];
          // Atualiza ou cria se checked, apaga se unchecked
          if (perm.can_access) {
            if (perm.id) {
              // Update
              await supabase
                .from("user_role_permissions")
                .update({ can_access: true, updated_at: new Date().toISOString() })
                .eq("id", perm.id);
            } else {
              // Insert
              await supabase
                .from("user_role_permissions")
                .insert({
                  role: perm.role,
                  module_id: perm.module_id,
                  can_access: true,
                });
            }
          } else if (perm.id) {
            // Delete permission row if exists and set to false
            await supabase
              .from("user_role_permissions")
              .delete()
              .eq("id", perm.id);
          }
        }
      }
      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso!",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar permissões.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="py-6 text-muted-foreground">Carregando módulos e permissões...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Poder de acesso dos perfis aos módulos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr>
              <th className="p-2 border">Perfil</th>
              {modules.map((mod) => (
                <th className="p-2 border whitespace-nowrap" key={mod.id}>
                  {mod.name} {mod.is_core && <span className="text-xs text-gray-400">(core)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role.value}>
                <td className="p-1 border font-medium">{role.label}</td>
                {modules.map((mod) => (
                  <td className="p-1 border text-center" key={mod.id}>
                    <Checkbox
                      checked={!!permissions[role.value][mod.id]?.can_access}
                      disabled={mod.is_core}
                      onCheckedChange={
                        (checked) => handleChange(role.value, mod, checked as boolean)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleModulePermissions;
