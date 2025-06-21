
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/components/Auth/AuthProvider';

interface CreateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateProfileModal = ({ open, onOpenChange }: CreateProfileModalProps) => {
  const { createProfile, modules } = useProfiles();
  const { companyInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_admin: false,
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInfo?.id) return;

    setLoading(true);
    try {
      const profile = await createProfile({
        ...formData,
        company_id: companyInfo.id,
        is_active: true,
      });

      // Se módulos foram selecionados, adicionar as permissões
      if (selectedModules.length > 0 && profile) {
        const { updateProfileModules } = useProfiles();
        await updateProfileModules(
          profile.id,
          selectedModules.map(moduleId => ({
            moduleId,
            canView: true,
            canEdit: !formData.is_admin, // Admin tem edit por padrão
            canDelete: false,
          }))
        );
      }

      onOpenChange(false);
      setFormData({ name: '', description: '', is_admin: false });
      setSelectedModules([]);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Agrupar módulos por categoria
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof modules>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Perfil</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do perfil"
                required
              />
            </div>
            <div className="space-y-2 flex items-center gap-2">
              <Checkbox
                id="is_admin"
                checked={formData.is_admin}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_admin: checked as boolean }))
                }
              />
              <Label htmlFor="is_admin">Perfil Administrativo</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do perfil"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Módulos Permitidos</Label>
            <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto border rounded p-4">
              {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-600 uppercase">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryModules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={module.id}
                          checked={selectedModules.includes(module.id)}
                          onCheckedChange={() => toggleModule(module.id)}
                        />
                        <Label htmlFor={module.id} className="text-sm">
                          {module.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Perfil'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
