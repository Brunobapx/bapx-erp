import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export const DatabaseReset = () => {
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('reset-database');
      
      if (error) throw error;
      
      if (data.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: data.message,
      });

      // Forçar logout e redirect para login
      await supabase.auth.signOut();
      window.location.href = '/auth';
      
    } catch (err: any) {
      console.error('Erro ao resetar banco:', err);
      toast({
        title: "Erro",
        description: err.message || 'Erro ao resetar banco de dados',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Operações irreversíveis que afetam todo o sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ATENÇÃO:</strong> Esta operação irá deletar TODOS os usuários do sistema e criar apenas o usuário master. Esta ação é irreversível!
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">Reset Completo do Sistema</h4>
          <p className="text-sm text-muted-foreground">
            Remove todos os usuários e cria o usuário master com email: bapx@bapx.com.br
          </p>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Resetar Banco de Dados
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmar Reset do Sistema
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <p>Você está prestes a executar um reset completo do sistema.</p>
                  <p className="font-medium text-destructive">Esta operação irá:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Deletar TODOS os usuários existentes</li>
                    <li>Remover todas as permissões e roles</li>
                    <li>Criar apenas o usuário master: bapx@bapx.com.br</li>
                    <li>Fazer logout automático do sistema</li>
                  </ul>
                  <p className="font-medium text-destructive">Esta ação é IRREVERSÍVEL!</p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Reset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};