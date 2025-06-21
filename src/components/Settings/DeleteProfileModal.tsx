
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProfiles } from '@/hooks/useProfiles';

interface DeleteProfileModalProps {
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteProfileModal = ({ profileId, open, onOpenChange }: DeleteProfileModalProps) => {
  const { profiles, deleteProfile } = useProfiles();
  const [loading, setLoading] = useState(false);

  const profile = profiles.find(p => p.id === profileId);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProfile(profileId);
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Tem certeza que deseja excluir o perfil "{profile.name}"? 
              Esta ação não pode ser desfeita e todos os usuários associados a este perfil perderão suas permissões.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading || profile.name === 'Master'}
            >
              {loading ? 'Excluindo...' : 'Excluir Perfil'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
