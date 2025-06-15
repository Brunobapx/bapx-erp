
import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, Key, Lock, Eye, AlertTriangle, Save } from "lucide-react";
import { useSecuritySettings } from "./useSecuritySettings";
import { SecurityCardSection } from "./SecurityCardSection";

export const SecuritySettings = () => {
  const {
    securitySettings,
    loading,
    validationErrors,
    saveSecuritySettings,
    handleSettingChange,
  } = useSecuritySettings();

  const authSettings = securitySettings.filter(s => s.category === 'authentication');
  const passwordSettings = securitySettings.filter(s => s.category === 'password');
  const generalSecuritySettings = securitySettings.filter(s => s.category === 'security');
  const encryptionSettings = securitySettings.filter(s => s.category === 'encryption');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configurações de Segurança</h3>
      </div>
      <SecurityCardSection
        title="Autenticação e Sessão"
        Icon={Key}
        settings={authSettings}
        validationErrors={validationErrors}
        onSettingChange={handleSettingChange}
      />
      <SecurityCardSection
        title="Políticas de Senha"
        Icon={Lock}
        settings={passwordSettings}
        validationErrors={validationErrors}
        onSettingChange={handleSettingChange}
      />
      <SecurityCardSection
        title="Segurança Geral"
        Icon={AlertTriangle}
        settings={generalSecuritySettings}
        validationErrors={validationErrors}
        onSettingChange={handleSettingChange}
      />
      <SecurityCardSection
        title="Criptografia"
        Icon={Eye}
        settings={encryptionSettings}
        validationErrors={validationErrors}
        onSettingChange={handleSettingChange}
      />
      <Button onClick={saveSecuritySettings} disabled={loading} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {loading ? 'Salvando...' : 'Salvar Configurações de Segurança'}
      </Button>
    </div>
  );
};
