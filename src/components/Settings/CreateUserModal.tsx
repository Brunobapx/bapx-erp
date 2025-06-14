
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

// Esquemas de validação
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

// URL da function edge do Supabase
const SUPABASE_PROJECT_URL = "https://gtqmwlxzszttzriswoxj.functions.supabase.co";
const CREATE_USER_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/create-user`;
// chave apikey (anon)
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cW13bHh6c3p0dHpyaXN3b3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzUwMjUsImV4cCI6MjA2MzM1MTAyNX0.03XyZCOF5UnUUaNpn44-MlQW0J6Vfo3_rb7mhE7D-Bk";

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
  }

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // Chamar a Edge Function na url COMPLETA (+ apikey obrigatória)
      const res = await fetch(CREATE_USER_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requester-role": userRole,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });

      // Tentar parsear resultado. Se não for json, apresentar erro bruto.
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("Erro inesperado: Não foi possível interpretar resposta do servidor.");
      }

      if (!res.ok) throw new Error(data?.error || "Erro na criação do usuário");

      toast({
        title: "Sucesso",
        description: "Usuário criado e ativado com sucesso!",
      });
      setForm({ email: '', password: '', role: 'user' });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Erro ao criar usuário",
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

