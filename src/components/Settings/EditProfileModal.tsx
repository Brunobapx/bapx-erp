
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfiles } from '@/hooks/useProfiles';

interface EditProfileModalProps {
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileModal = ({ profileId, open, onOpenChange }: EditProfileModalProps) => {
  const { profiles, modules, updateProfile, loadProfileModules, updateProfileModules } = useProfiles();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_admin: false,
    is_active: true,
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const profile = profiles.find(p => p.id === profileId);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        description: profile.description || '',
        is_admin: profile.is_admin,
        is_active: profile.is_active,
      });

      // Carregar módulos do perfil
      loadProfileModules(profileId).then(profileModules => {
        setSelectedModules(profileModules.map(pm => pm.module_id));
      });
    }
  }, [profile, profileId, loadProfileModules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profileId, formData);
      
      // Atualizar módulos
      await updateProfileModules(
        profileId,
        selectedModules.map(moduleId => ({
          moduleId,
          canView: true,
          canEdit: !formData.is_admin,
          canDelete: false,
        }))
      );

      onOpenChange(false);
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

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil: {profile.name}</DialogTitle>
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
                disabled={profile.name === 'Master'}
              />
            </div>
            <div className="space-y-2 flex items-center gap-2">
              <Checkbox
                id="is_admin"
                checked={formData.is_admin}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_admin: checked as boolean }))
                }
                disabled={profile.name === 'Master'}
              />
              <Label htmlFor="is_admin">Perfil Administrativo</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_active: checked as boolean }))
                }
                disabled={profile.name === 'Master'}
              />
              <Label htmlFor="is_active">Perfil Ativo</Label>
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
                          disabled={profile.name === 'Master'}
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
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
