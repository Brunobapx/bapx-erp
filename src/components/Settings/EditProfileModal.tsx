
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProfileFormFields } from './EditProfile/ProfileFormFields';
import { ModulePermissions } from './EditProfile/ModulePermissions';
import { useEditProfileForm } from './EditProfile/useEditProfileForm';

interface EditProfileModalProps {
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileModal = ({ profileId, open, onOpenChange }: EditProfileModalProps) => {
  const {
    profile,
    modules,
    formData,
    selectedModules,
    loading,
    handleFormDataChange,
    toggleModule,
    handleSubmit,
  } = useEditProfileForm(profileId, open);

  if (!profile && open) {
    console.log('Profile not found:', profileId);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-gray-600">
              Perfil não encontrado ou ainda carregando...
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return null;
  }

  const isMasterProfile = profile.name === 'Master';

  const onSubmit = async (e: React.FormEvent) => {
    const success = await handleSubmit(e);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil: {profile.name}</DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando dados do perfil...</span>
          </div>
        )}
        
        {!loading && (
          <form onSubmit={onSubmit} className="space-y-6">
            <ProfileFormFields
              formData={formData}
              onFormDataChange={handleFormDataChange}
              isMasterProfile={isMasterProfile}
            />

            <ModulePermissions
              modules={modules}
              selectedModules={selectedModules}
              onToggleModule={toggleModule}
              isMasterProfile={isMasterProfile}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
