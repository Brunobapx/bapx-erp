
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, FileCheck, FileX } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BankReconciliation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Get bank accounts for the dropdown
  const { data: accounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('is_active', true)
          .order('name');
          
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Erro ao carregar contas bancárias",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  // Get recent reconciliation records
  const { data: reconciliations } = useQuery({
    queryKey: ['bankReconciliations'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('bank_reconciliations')
          .select('*, bank_accounts(name)')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Erro ao carregar conciliações",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  const uploadMutation = useMutation({
    mutationFn: async ({ 
      accountId, 
      file 
    }: { 
      accountId: string, 
      file: File 
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Upload the file to Supabase Storage (would be implemented in a real project)
      // Since we don't have storage bucket setup in this demo, we'll simulate this step
      const filePath = `reconciliations/${Date.now()}_${file.name}`;
      
      // 2. Create reconciliation record
      const { data, error } = await supabase
        .from('bank_reconciliations')
        .insert([{
          user_id: user.email,
          bank_account_id: accountId,
          file_name: file.name,
          file_path: filePath, // In a real implementation, this would be the actual storage path
          status: 'pending'
        }]);
        
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankReconciliations'] });
      toast({
        title: "Arquivo enviado",
        description: "O arquivo para conciliação foi enviado com sucesso.",
      });
      // Reset form
      setFile(null);
      setSelectedAccountId('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro no envio",
        description: error.message || "Ocorreu um erro ao enviar o arquivo.",
        variant: "destructive",
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId) {
      toast({
        title: "Selecione uma conta",
        description: "Por favor, selecione uma conta bancária.",
        variant: "destructive",
      });
      return;
    }
    
    if (!file) {
      toast({
        title: "Selecione um arquivo",
        description: "Por favor, selecione um arquivo para upload.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({ accountId: selectedAccountId, file });
    } finally {
      setIsUploading(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <FileCheck className="h-5 w-5 text-green-500" />;
      case 'error':
        return <FileX className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-amber-500" />;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conciliação Bancária</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">Conta Bancária</Label>
            <Select 
              value={selectedAccountId} 
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta bancária" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo de Extrato</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".csv,.ofx,.qfx,.xlsx,.xls"
                className="flex-1"
              />
              <Button type="submit" disabled={isUploading || !file || !selectedAccountId}>
                {isUploading ? 'Enviando...' : 'Enviar'}
                {!isUploading && <Upload className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: .csv, .ofx, .qfx, .xlsx, .xls
            </p>
          </div>
        </form>
        
        <div>
          <h3 className="font-medium mb-3">Conciliações Recentes</h3>
          
          {reconciliations && reconciliations.length > 0 ? (
            <div className="space-y-2">
              {reconciliations.map((item: any) => (
                <div key={item.id} className="border rounded-md p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium">{item.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.bank_accounts?.name || 'Conta não encontrada'} • 
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="stage-badge badge-finance capitalize">
                    {item.status === 'pending' ? 'Pendente' : 
                     item.status === 'completed' ? 'Concluído' : 
                     item.status === 'error' ? 'Erro' : item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma conciliação bancária recente.
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 text-sm">
          <h3 className="font-medium mb-2">Como funciona a conciliação bancária?</h3>
          <p>A conciliação bancária permite comparar os lançamentos do seu extrato bancário com os registros financeiros do sistema.</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Exporte o extrato da sua conta bancária em formato CSV, OFX ou similar.</li>
            <li>Selecione a conta correspondente e faça o upload do arquivo.</li>
            <li>O sistema irá comparar os lançamentos e identificar discrepâncias.</li>
            <li>Você poderá reconciliar os lançamentos e manter seu controle financeiro atualizado.</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankReconciliation;
