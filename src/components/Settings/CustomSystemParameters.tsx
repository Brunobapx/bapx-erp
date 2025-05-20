
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ParametersCard from './ParametersCard';
import { Settings, Calendar, Bell } from "lucide-react";
import DatabaseInfo from './DatabaseInfo';

const CustomSystemParameters = () => {
  const { toast } = useToast();
  
  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações do sistema foram atualizadas com sucesso.",
    });
  };

  return (
    <div>
      <DatabaseInfo />
      
      <ParametersCard 
        title="Parâmetros Gerais" 
        icon={<Settings className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input id="company-name" defaultValue="Minha Empresa" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Ativar tema escuro no sistema
              </div>
            </div>
            <Switch id="dark-mode" />
          </div>
        </div>
      </ParametersCard>
      
      <ParametersCard 
        title="Notificações" 
        icon={<Bell className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notificações por E-mail</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Receber alertas de pedidos por email
              </div>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="stock-alerts">Alertas de Estoque</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Notificar quando estoque estiver baixo
              </div>
            </div>
            <Switch id="stock-alerts" defaultChecked />
          </div>
        </div>
      </ParametersCard>
      
      <ParametersCard 
        title="Calendário e Datas" 
        icon={<Calendar className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="date-format">Formato de Data</Label>
            <select 
              id="date-format"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue="DD/MM/YYYY"
            >
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekend-days">Dias de Trabalho nos Fins de Semana</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Incluir sábados e domingos como dias úteis
              </div>
            </div>
            <Switch id="weekend-days" />
          </div>
        </div>
      </ParametersCard>
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default CustomSystemParameters;
