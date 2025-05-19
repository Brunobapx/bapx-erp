
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Sliders, Mail, Bell, Shield, Database } from 'lucide-react';

const SystemSettings = () => {
  const { toast } = useToast();

  const handleSaveGeneral = () => {
    toast({
      title: "Configurações gerais salvas",
      description: "As configurações gerais do sistema foram atualizadas com sucesso.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Configurações de notificações salvas",
      description: "As configurações de notificações foram atualizadas com sucesso.",
    });
  };

  const handleSaveEmail = () => {
    toast({
      title: "Configurações de email salvas",
      description: "As configurações de email foram atualizadas com sucesso.",
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: "Configurações de segurança salvas",
      description: "As configurações de segurança foram atualizadas com sucesso.",
    });
  };

  const handleTestEmail = () => {
    toast({
      title: "Email de teste enviado",
      description: "Um email de teste foi enviado para verificar suas configurações.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sistema</CardTitle>
        <CardDescription>Gerencie configurações gerais do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">
              <Sliders className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="h-4 w-4 mr-2" />
              Banco de Dados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="auto-logout" className="text-base font-medium">
                    Logout Automático
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Desconecta automaticamente usuários inativos
                  </p>
                </div>
                <Switch id="auto-logout" />
              </div>

              <div className="grid grid-cols-2 items-center gap-4 border p-4 rounded-lg">
                <div>
                  <Label htmlFor="timeout-duration" className="text-base font-medium">
                    Tempo de Inatividade
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tempo em minutos até o logout automático
                  </p>
                </div>
                <div>
                  <Select defaultValue="30">
                    <SelectTrigger id="timeout-duration">
                      <SelectValue placeholder="Selecione o tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="multi-login" className="text-base font-medium">
                    Permitir Login Simultâneo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que um usuário faça login em múltiplos dispositivos
                  </p>
                </div>
                <Switch id="multi-login" />
              </div>

              <div className="grid grid-cols-2 items-center gap-4 border p-4 rounded-lg">
                <div>
                  <Label htmlFor="date-format" className="text-base font-medium">
                    Formato de Data
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Formato padrão para exibição de datas
                  </p>
                </div>
                <div>
                  <Select defaultValue="dd/MM/yyyy">
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 items-center gap-4 border p-4 rounded-lg">
                <div>
                  <Label htmlFor="currency-format" className="text-base font-medium">
                    Formato de Moeda
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Formato padrão para valores monetários
                  </p>
                </div>
                <div>
                  <Select defaultValue="BRL">
                    <SelectTrigger id="currency-format">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">R$ 1.234,56 (Português-BR)</SelectItem>
                      <SelectItem value="USD">$ 1,234.56 (Inglês-US)</SelectItem>
                      <SelectItem value="EUR">€ 1.234,56 (Europeu)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="debug-mode" className="text-base font-medium">
                    Modo de Depuração
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe informações detalhadas de erros e logs
                  </p>
                </div>
                <Switch id="debug-mode" />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={handleSaveGeneral}>Salvar Configurações Gerais</Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium">
                    Notificações por Email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Envia notificações por email para eventos importantes
                  </p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="system-notifications" className="text-base font-medium">
                    Notificações do Sistema
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe notificações no sistema para eventos importantes
                  </p>
                </div>
                <Switch id="system-notifications" defaultChecked />
              </div>

              <div className="space-y-2 border p-4 rounded-lg">
                <Label className="text-base font-medium">
                  Eventos para Notificação
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione quais eventos devem gerar notificações
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-new-order" defaultChecked />
                    <Label htmlFor="notify-new-order">Novos Pedidos</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-prod-completion" defaultChecked />
                    <Label htmlFor="notify-prod-completion">Conclusão de Produção</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-pack-completion" defaultChecked />
                    <Label htmlFor="notify-pack-completion">Conclusão de Embalagem</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-delivery" defaultChecked />
                    <Label htmlFor="notify-delivery">Entrega de Pedido</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-payment" defaultChecked />
                    <Label htmlFor="notify-payment">Pagamentos Recebidos</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-stock-low" defaultChecked />
                    <Label htmlFor="notify-stock-low">Estoque Baixo</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-fiscal" defaultChecked />
                    <Label htmlFor="notify-fiscal">Emissão de Documentos Fiscais</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-user" />
                    <Label htmlFor="notify-user">Novos Usuários</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={handleSaveNotifications}>Salvar Configurações de Notificações</Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">Servidor SMTP</Label>
                  <Input id="smtp-server" placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Usuário</Label>
                  <Input id="smtp-username" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Senha</Label>
                  <Input id="smtp-password" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-from">Email de Origem</Label>
                  <Input id="smtp-from" placeholder="noreply@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-name">Nome de Exibição</Label>
                  <Input id="smtp-name" placeholder="Sistema ERP" />
                </div>
              </div>

              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="smtp-ssl" className="text-base font-medium">
                    Usar SSL/TLS
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Utiliza conexão segura com o servidor SMTP
                  </p>
                </div>
                <Switch id="smtp-ssl" defaultChecked />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleTestEmail}>Enviar Email de Teste</Button>
                <Button onClick={handleSaveEmail}>Salvar Configurações de Email</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="two-factor" className="text-base font-medium">
                    Autenticação de Dois Fatores
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Exige verificação adicional ao fazer login
                  </p>
                </div>
                <Switch id="two-factor" />
              </div>

              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="strong-passwords" className="text-base font-medium">
                    Exigir Senhas Fortes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Requer senhas com letras, números e caracteres especiais
                  </p>
                </div>
                <Switch id="strong-passwords" defaultChecked />
              </div>

              <div className="grid grid-cols-2 items-center gap-4 border p-4 rounded-lg">
                <div>
                  <Label htmlFor="password-expiration" className="text-base font-medium">
                    Expiração de Senha
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tempo antes de exigir troca de senha
                  </p>
                </div>
                <Select defaultValue="90">
                  <SelectTrigger id="password-expiration">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 items-center gap-4 border p-4 rounded-lg">
                <div>
                  <Label htmlFor="max-login-attempts" className="text-base font-medium">
                    Máx. Tentativas de Login
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Número de tentativas antes de bloquear a conta
                  </p>
                </div>
                <Select defaultValue="5">
                  <SelectTrigger id="max-login-attempts">
                    <SelectValue placeholder="Selecione a quantidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 tentativas</SelectItem>
                    <SelectItem value="5">5 tentativas</SelectItem>
                    <SelectItem value="10">10 tentativas</SelectItem>
                    <SelectItem value="unlimited">Ilimitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <Label htmlFor="log-activities" className="text-base font-medium">
                    Registrar Atividades dos Usuários
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mantém registro de todas as ações realizadas no sistema
                  </p>
                </div>
                <Switch id="log-activities" defaultChecked />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={handleSaveSecurity}>Salvar Configurações de Segurança</Button>
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-4 border p-4 rounded-lg">
                <div>
                  <Label htmlFor="backup-frequency" className="text-base font-medium">
                    Frequência de Backup
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Com que frequência o sistema fará backup automático
                  </p>
                </div>
                <Select defaultValue="daily">
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 items-center gap-4 border p-4 rounded-lg">
                <div>
                  <Label htmlFor="backup-retention" className="text-base font-medium">
                    Retenção de Backup
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Por quanto tempo manter os backups
                  </p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger id="backup-retention">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                    <SelectItem value="365">1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border p-4 rounded-lg space-y-2">
                <Label className="text-base font-medium">Backup Manual</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Faça um backup manual do banco de dados
                </p>
                <Button>Fazer Backup Agora</Button>
              </div>

              <div className="border p-4 rounded-lg space-y-2">
                <Label className="text-base font-medium">Manutenção do Banco de Dados</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Execute rotinas de manutenção para otimizar o desempenho
                </p>
                <Button variant="outline">Executar Manutenção</Button>
              </div>
            </div>

            <div className="border p-4 rounded-lg space-y-2">
              <Label className="text-base font-medium text-destructive">Zona de Perigo</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Estas ações são irreversíveis e potencialmente destrutivas
              </p>
              <div className="flex space-x-2">
                <Button variant="destructive">Limpar Dados de Teste</Button>
                <Button variant="destructive">Redefinir Sistema</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
