
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw } from 'lucide-react';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

interface CreateUserModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  availableRoles: Array<{ value: string, label: string, masterOnly?: boolean }>;
  userRole: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open, setOpen, onSuccess, availableRoles, userRole
}) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'user',
  });
  const [validationErrors, setValidationErrors] = useState<{ email?: string, password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    try {
      emailSchema.parse(form.email);
    } catch (err) {
      if (err instanceof z.ZodError) errors.email = err.errors[0]?.message;
    }
    try {
      passwordSchema.parse(form.password);
    } catch (err) {
      if (err instanceof z.ZodError) errors.password = err.errors[0]?.message;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      console.log("Iniciando criação de usuário...");
      console.log("Dados:", { email: form.email, role: form.role, userRole });

      // Obter o token de autenticação atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      console.log("Token obtido, chamando Edge Function...");

      // Chamar Edge Function com token de autorização
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-requester-role': userRole
        }
      });

      console.log("Resposta da Edge Function:", { data, error });

      if (error) {
        console.error("Erro da Edge Function:", error);
        throw new Error(`Erro na comunicação: ${error.message}`);
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      if (!data?.success) {
        console.error("Resposta inesperada:", data);
        throw new Error("Resposta inesperada do servidor");
      }

      console.log("Usuário criado com sucesso! Company ID:", data.company_id);
      
      toast({
        title: "Sucesso",
        description: "Usuário criado e associado à empresa com sucesso!",
      });
      
      setForm({ email: '', password: '', role: 'user' });
      setOpen(false);
      onSuccess();
      
    } catch (err: any) {
      console.error("Erro completo:", err);
      
      let errorMessage = "Erro desconhecido ao criar usuário";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Mensagens mais específicas baseadas no tipo de erro
      if (errorMessage.includes("Failed to send")) {
        errorMessage = "Erro de comunicação com o servidor. Verifique sua conexão.";
      } else if (errorMessage.includes("fetch")) {
        errorMessage = "Erro de rede. Tente novamente em alguns instantes.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              placeholder="usuario@email.com"
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
              placeholder="Senha temporária"
              className={validationErrors.password ? 'border-red-500' : ''}
            />
            {validationErrors.password && (
              <p className="text-sm text-red-500">{validationErrors.password}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={form.role} onValueChange={role => setForm(v => ({ ...v, role }))}>
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
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : "Criar Usuário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
