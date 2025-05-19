
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Save, 
  Bell, 
  Clock, 
  ServerCrash,
  Mail,
  Shield,
  Database
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const SystemParameters = () => {
  const [hasChanges, setHasChanges] = useState(false);
  
  // General parameters
  const [generalParams, setGeneralParams] = useState({
    minStockAlert: 5,
    avgProductionTime: 8,
    workingHoursPerDay: 8,
    daysBeforeExpiry: 30
  });

  // Notification parameters
  const [notificationParams, setNotificationParams] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    orderAlerts: true,
    productionDelayAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    monthlyReports: true
  });

  // Email parameters
  const [emailParams, setEmailParams] = useState({
    smtpServer: 'smtp.example.com',
    smtpPort: '587',
    smtpUsername: 'notifications@example.com',
    smtpPassword: '********',
    senderName: 'ERP System',
    senderEmail: 'erp@example.com'
  });

  // Security parameters
  const [securityParams, setSecurityParams] = useState({
    loginAttempts: 5,
    sessionTimeout: 30,
    passwordExpiration: 90,
    twoFactorAuth: false,
    passwordMinLength: 8,
    requireSpecialChars: true
  });

  // Database parameters
  const [databaseParams, setDatabaseParams] = useState({
    backupFrequency: 'daily',
    backupRetention: 30,
    autoVacuum: true,
    logRetention: 90
  });

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralParams({
      ...generalParams,
      [name]: Number(value)
    });
    setHasChanges(true);
  };

  const handleNotificationToggle = (name: string, checked: boolean) => {
    setNotificationParams({
      ...notificationParams,
      [name]: checked
    });
    setHasChanges(true);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailParams({
      ...emailParams,
      [name]: value
    });
    setHasChanges(true);
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityParams({
      ...securityParams,
      [name]: Number(value)
    });
    setHasChanges(true);
  };

  const handleSecurityToggle = (name: string, checked: boolean) => {
    setSecurityParams({
      ...securityParams,
      [name]: checked
    });
    setHasChanges(true);
  };

  const handleDatabaseChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDatabaseParams({
      ...databaseParams,
      [name]: value
    });
    setHasChanges(true);
  };

  const handleDatabaseToggle = (name: string, checked: boolean) => {
    setDatabaseParams({
      ...databaseParams,
      [name]: checked
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // Here would be the API call to save the parameters
    toast.success('Parâmetros do sistema salvos com sucesso');
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Parâmetros do Sistema</CardTitle>
            <CardDescription>
              Configure os parâmetros operacionais do sistema
            </CardDescription>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" /> Salvar Alterações
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStockAlert">
                    Alerta de Estoque Mínimo
                  </Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="minStockAlert"
                      name="minStockAlert"
                      type="number"
                      min="0"
                      value={generalParams.minStockAlert}
                      onChange={handleGeneralChange}
                    />
                    <span className="ml-2 text-sm text-muted-foreground">unidades</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quantidade mínima antes de gerar um alerta de estoque baixo
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="avgProductionTime">
                    Tempo Médio de Produção
                  </Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="avgProductionTime"
                      name="avgProductionTime"
                      type="number"
                      min="0"
                      value={generalParams.avgProductionTime}
                      onChange={handleGeneralChange}
                    />
                    <span className="ml-2 text-sm text-muted-foreground">horas</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tempo médio estimado para produção de um item
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="workingHoursPerDay">
                    Horas de Trabalho por Dia
                  </Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="workingHoursPerDay"
                      name="workingHoursPerDay"
                      type="number"
                      min="1"
                      max="24"
                      value={generalParams.workingHoursPerDay}
                      onChange={handleGeneralChange}
                    />
                    <span className="ml-2 text-sm text-muted-foreground">horas</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Horas de trabalho diárias para cálculos de produção
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="daysBeforeExpiry">
                    Dias Antes do Vencimento
                  </Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="daysBeforeExpiry"
                      name="daysBeforeExpiry"
                      type="number"
                      min="1"
                      value={generalParams.daysBeforeExpiry}
                      onChange={handleGeneralChange}
                    />
                    <span className="ml-2 text-sm text-muted-foreground">dias</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dias antes do vencimento para alertar sobre faturas a pagar
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-muted">
                  <CardHeader className="p-4">
                    <div className="flex items-center">
                      <Bell className="mr-2 h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Alertas Operacionais</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotifications" className="cursor-pointer">
                        Enviar notificações por e-mail
                      </Label>
                      <Switch
                        id="emailNotifications"
                        checked={notificationParams.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationToggle('emailNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lowStockAlerts" className="cursor-pointer">
                        Alertas de estoque baixo
                      </Label>
                      <Switch
                        id="lowStockAlerts"
                        checked={notificationParams.lowStockAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle('lowStockAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="orderAlerts" className="cursor-pointer">
                        Alertas de novos pedidos
                      </Label>
                      <Switch
                        id="orderAlerts"
                        checked={notificationParams.orderAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle('orderAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="productionDelayAlerts" className="cursor-pointer">
                        Alertas de atraso na produção
                      </Label>
                      <Switch
                        id="productionDelayAlerts"
                        checked={notificationParams.productionDelayAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle('productionDelayAlerts', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-muted">
                  <CardHeader className="p-4">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Relatórios Automáticos</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dailyReports" className="cursor-pointer">
                        Relatórios diários
                      </Label>
                      <Switch
                        id="dailyReports"
                        checked={notificationParams.dailyReports}
                        onCheckedChange={(checked) => handleNotificationToggle('dailyReports', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weeklyReports" className="cursor-pointer">
                        Relatórios semanais
                      </Label>
                      <Switch
                        id="weeklyReports"
                        checked={notificationParams.weeklyReports}
                        onCheckedChange={(checked) => handleNotificationToggle('weeklyReports', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="monthlyReports" className="cursor-pointer">
                        Relatórios mensais
                      </Label>
                      <Switch
                        id="monthlyReports"
                        checked={notificationParams.monthlyReports}
                        onCheckedChange={(checked) => handleNotificationToggle('monthlyReports', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="email">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-muted">
                  <CardHeader className="p-4">
                    <div className="flex items-center">
                      <ServerCrash className="mr-2 h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Configuração SMTP</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label htmlFor="smtpServer">Servidor SMTP</Label>
                      <Input
                        id="smtpServer"
                        name="smtpServer"
                        value={emailParams.smtpServer}
                        onChange={handleEmailChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtpPort">Porta SMTP</Label>
                      <Input
                        id="smtpPort"
                        name="smtpPort"
                        value={emailParams.smtpPort}
                        onChange={handleEmailChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtpUsername">Usuário SMTP</Label>
                      <Input
                        id="smtpUsername"
                        name="smtpUsername"
                        value={emailParams.smtpUsername}
                        onChange={handleEmailChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtpPassword">Senha SMTP</Label>
                      <Input
                        id="smtpPassword"
                        name="smtpPassword"
                        type="password"
                        value={emailParams.smtpPassword}
                        onChange={handleEmailChange}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-muted">
                  <CardHeader className="p-4">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Configuração do Remetente</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label htmlFor="senderName">Nome do Remetente</Label>
                      <Input
                        id="senderName"
                        name="senderName"
                        value={emailParams.senderName}
                        onChange={handleEmailChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="senderEmail">E-mail do Remetente</Label>
                      <Input
                        id="senderEmail"
                        name="senderEmail"
                        type="email"
                        value={emailParams.senderEmail}
                        onChange={handleEmailChange}
                      />
                    </div>
                    
                    <div className="mt-6">
                      <Button variant="outline" size="sm" className="w-full">
                        Testar configurações de e-mail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="space-y-4">
              <Card className="border-muted">
                <CardHeader className="p-4">
                  <div className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Configurações de Segurança</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="loginAttempts">
                        Tentativas de Login
                      </Label>
                      <Input
                        id="loginAttempts"
                        name="loginAttempts"
                        type="number"
                        min="1"
                        value={securityParams.loginAttempts}
                        onChange={handleSecurityChange}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Número máximo de tentativas de login antes do bloqueio
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="sessionTimeout">
                        Timeout da Sessão
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="sessionTimeout"
                          name="sessionTimeout"
                          type="number"
                          min="1"
                          value={securityParams.sessionTimeout}
                          onChange={handleSecurityChange}
                        />
                        <span className="ml-2 text-sm text-muted-foreground">minutos</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo de inatividade antes da sessão expirar
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="passwordExpiration">
                        Expiração de Senha
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="passwordExpiration"
                          name="passwordExpiration"
                          type="number"
                          min="0"
                          value={securityParams.passwordExpiration}
                          onChange={handleSecurityChange}
                        />
                        <span className="ml-2 text-sm text-muted-foreground">dias</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dias até a senha expirar (0 = nunca expira)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="passwordMinLength">
                        Tamanho Mínimo da Senha
                      </Label>
                      <Input
                        id="passwordMinLength"
                        name="passwordMinLength"
                        type="number"
                        min="4"
                        value={securityParams.passwordMinLength}
                        onChange={handleSecurityChange}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Número mínimo de caracteres para senhas
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="twoFactorAuth"
                        checked={securityParams.twoFactorAuth}
                        onCheckedChange={(checked) => handleSecurityToggle('twoFactorAuth', checked)}
                      />
                      <Label htmlFor="twoFactorAuth">
                        Autenticação de dois fatores
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireSpecialChars"
                        checked={securityParams.requireSpecialChars}
                        onCheckedChange={(checked) => handleSecurityToggle('requireSpecialChars', checked)}
                      />
                      <Label htmlFor="requireSpecialChars">
                        Exigir caracteres especiais na senha
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="database">
            <div className="space-y-4">
              <Card className="border-muted">
                <CardHeader className="p-4">
                  <div className="flex items-center">
                    <Database className="mr-2 h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Configurações de Banco de Dados</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backupFrequency">
                        Frequência de Backup
                      </Label>
                      <select
                        id="backupFrequency"
                        name="backupFrequency"
                        value={databaseParams.backupFrequency}
                        onChange={handleDatabaseChange as any}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      >
                        <option value="hourly">A cada hora</option>
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Frequência com que os backups são realizados
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="backupRetention">
                        Retenção de Backup
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="backupRetention"
                          name="backupRetention"
                          type="number"
                          min="1"
                          value={databaseParams.backupRetention}
                          onChange={handleDatabaseChange as any}
                        />
                        <span className="ml-2 text-sm text-muted-foreground">dias</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por quantos dias os backups são mantidos
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="logRetention">
                        Retenção de Logs
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="logRetention"
                          name="logRetention"
                          type="number"
                          min="1"
                          value={databaseParams.logRetention}
                          onChange={handleDatabaseChange as any}
                        />
                        <span className="ml-2 text-sm text-muted-foreground">dias</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por quantos dias os logs do sistema são mantidos
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoVacuum"
                        checked={databaseParams.autoVacuum}
                        onCheckedChange={(checked) => handleDatabaseToggle('autoVacuum', checked)}
                      />
                      <Label htmlFor="autoVacuum">
                        Auto vacuum (otimização automática)
                      </Label>
                    </div>
                    
                    <div className="md:col-span-2 mt-4">
                      <Button variant="outline" size="sm" className="mr-2">
                        Fazer backup manual
                      </Button>
                      <Button variant="outline" size="sm">
                        Limpar cache do sistema
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemParameters;
