
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, UserPermissions, modules } from './types/UserTypes';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: () => void;
  setUser: (user: User | null) => void;
}

const UserDialog = ({ isOpen, onClose, user, onSave, setUser }: UserDialogProps) => {
  if (!user) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações do usuário e defina-o como administrador para conceder acesso total.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input 
              id="name" 
              value={user.name || ''}
              onChange={(e) => setUser({...user, name: e.target.value})}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is-admin" 
              checked={user.isAdmin || false}
              onCheckedChange={(checked) => setUser({
                ...user, 
                isAdmin: checked === true,
                role: checked === true ? 'admin' : 'user'
              })}
            />
            <Label htmlFor="is-admin">Administrador do sistema (acesso completo)</Label>
          </div>
          
          <div className="space-y-2">
            <Label>Módulos acessíveis para usuários não-administradores</Label>
            <div className="grid grid-cols-2 gap-2">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`permission-${module.id}`} 
                    checked={user.permissions?.[module.id as keyof UserPermissions] || false}
                    disabled={module.id === 'configuracoes' || !user || user.isAdmin}
                    onCheckedChange={(checked) => {
                      if (!user || user.isAdmin) return;
                      
                      setUser({
                        ...user,
                        permissions: {
                          ...user.permissions,
                          [module.id as keyof UserPermissions]: checked === true
                        }
                      });
                    }}
                  />
                  <Label 
                    htmlFor={`permission-${module.id}`}
                    className={module.id === 'configuracoes' ? "text-muted-foreground" : ""}
                  >
                    {module.name}
                    {module.id === 'configuracoes' && " (apenas admin)"}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
