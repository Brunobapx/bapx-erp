
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, RefreshCw } from 'lucide-react';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Input validation schema
const emailSchema = z.string().email('Email inválido');

interface InviteUserModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  availableRoles: Array<{ value: string, label: string, masterOnly?: boolean }>;
  userRole: string;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ open, setOpen, onSuccess, availableRoles, userRole }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [validationErrors, setValidationErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors({ email: error.errors[0]?.message });
      }
      return false;
    }
  };

  const sendInvitation = async () => {
    if (!validateEmail(inviteEmail.trim())) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteEmail.trim(),
          role: inviteRole,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso!",
      });

      setInviteEmail('');
      setInviteRole('user');
      setOpen(false);
      onSuccess();
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="usuario@email.com"
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role =>
                  role.value === 'master' && userRole !== 'master' ? null : (
                    <SelectItem value={role.value} key={role.value}>
                      {role.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={sendInvitation} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Enviar Convite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserModal;
