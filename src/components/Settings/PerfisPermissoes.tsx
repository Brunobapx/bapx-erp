
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";

interface Perfil {
  id: string;
  nome: string;
  descricao?: string;
  is_admin: boolean;
}

interface Module {
  id: string;
  name: string;
  route_path: string;
  category: string;
}

interface Permissao {
  perfil_id: string;
  module_id: string;
  pode_ver: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

export const PerfisPermissoes = () => {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar perfis da empresa
      const { data: perfisData } = await supabase
        .from('perfis')
        .select('*')
        .eq('empresa_id', companyInfo?.id)
        .order('nome');

      // Carregar módulos
      const { data: modulesData } = await supabase
        .from('saas_modules')
        .select('*')
        .order('category', { ascending: true });

      // Carregar permissões existentes
      const { data: permissoesData } = await supabase
        .from('permissoes')
        .select(`
          *,
          perfis!inner(empresa_id)
        `)
        .eq('perfis.empresa_id', companyInfo?.id);

      setPerfis(perfisData || []);
      setModules(modulesData || []);
      setPermissoes(permissoesData || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    perfilId: string, 
    moduleId: string, 
    tipo: 'pode_ver' | 'pode_editar' | 'pode_excluir', 
    valor: boolean
  ) => {
    try {
      // Verificar se já existe permissão
      const existingPermission = permissoes.find(
        p => p.perfil_id === perfilId && p.module_id === moduleId
      );

      if (existingPermission) {
        // Atualizar permissão existente
        const { error } = await supabase
          .from('permissoes')
          .update({ [tipo]: valor })
          .eq('perfil_id', perfilId)
          .eq('module_id', moduleId);

        if (error) throw error;

        // Atualizar estado local
        setPermissoes(prev => prev.map(p => 
          p.perfil_id === perfilId && p.module_id === moduleId
            ? { ...p, [tipo]: valor }
            : p
        ));
      } else {
        // Criar nova permissão
        const newPermission = {
          perfil_id: perfilId,
          module_id: moduleId,
          pode_ver: tipo === 'pode_ver' ? valor : false,
          pode_editar: tipo === 'pode_editar' ? valor : false,
          pode_excluir: tipo === 'pode_excluir' ? valor : false,
        };

        const { error } = await supabase
          .from('permissoes')
          .insert(newPermission);

        if (error) throw error;

        // Atualizar estado local
        setPermissoes(prev => [...prev, newPermission]);
      }

      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive",
      });
    }
  };

  const getPermission = (perfilId: string, moduleId: string, tipo: 'pode_ver' | 'pode_editar' | 'pode_excluir') => {
    const permission = permissoes.find(p => p.perfil_id === perfilId && p.module_id === moduleId);
    return permission ? permission[tipo] : false;
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  // Agrupar módulos por categoria
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfis e Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-primary">{category}</h3>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Módulo</TableHead>
                      {perfis.map(perfil => (
                        <TableHead key={perfil.id} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium">{perfil.nome}</span>
                            {perfil.is_admin && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryModules.map(module => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">
                          {module.name}
                        </TableCell>
                        {perfis.map(perfil => (
                          <TableCell key={perfil.id} className="text-center">
                            {perfil.is_admin ? (
                              <Badge variant="default" className="text-xs">
                                Acesso Total
                              </Badge>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={getPermission(perfil.id, module.id, 'pode_ver')}
                                    onCheckedChange={(checked) => 
                                      updatePermission(perfil.id, module.id, 'pode_ver', checked as boolean)
                                    }
                                  />
                                  <span className="text-xs">Ver</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={getPermission(perfil.id, module.id, 'pode_editar')}
                                    onCheckedChange={(checked) => 
                                      updatePermission(perfil.id, module.id, 'pode_editar', checked as boolean)
                                    }
                                  />
                                  <span className="text-xs">Editar</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={getPermission(perfil.id, module.id, 'pode_excluir')}
                                    onCheckedChange={(checked) => 
                                      updatePermission(perfil.id, module.id, 'pode_excluir', checked as boolean)
                                    }
                                  />
                                  <span className="text-xs">Excluir</span>
                                </div>
                              </div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
