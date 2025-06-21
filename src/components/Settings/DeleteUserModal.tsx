
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface DeleteUserModalProps {
  userId: string;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string) => Promise<void>;
  currentUserId?: string;
}

export const DeleteUserModal = ({ 
  userId, 
  userName, 
  userEmail, 
  open, 
  onOpenChange, 
  onConfirm, 
  currentUserId 
}: DeleteUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const isCurrentUser = userId === currentUserId;

  const handleDelete = async () => {
    if (isCurrentUser) return;
    
    setLoading(true);
    try {
      await onConfirm(userId);
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Excluir Usuário
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isCurrentUser ? (
            <Alert>
              <AlertDescription>
                Você não pode excluir sua própria conta.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertDescription>
                  <strong>ATENÇÃO:</strong> Esta ação é irreversível! 
                  Tem certeza que deseja excluir permanentemente o usuário:
                  <br />
                  <strong>{userName || userEmail}</strong> ({userEmail})
                  <br /><br />
                  Todos os dados associados a este usuário serão perdidos.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Excluindo...' : 'Excluir Usuário'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
