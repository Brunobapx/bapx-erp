
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfiles } from '@/hooks/useProfiles';

interface DeleteProfileModalProps {
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteProfileModal = ({ profileId, open, onOpenChange }: DeleteProfileModalProps) => {
  const { profiles, deleteProfile } = useProfiles();
  
  const profile = profiles.find(p => p.id === profileId);

  const handleDelete = async () => {
    try {
      await deleteProfile(profileId);
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (!profile) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Perfil</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o perfil "{profile.name}"? 
            Esta ação não pode ser desfeita e todos os usuários com este perfil perderão suas permissões.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
