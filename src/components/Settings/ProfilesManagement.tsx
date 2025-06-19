
import React from "react";
import { PerfisPermissoes } from "./PerfisPermissoes";

const ProfilesManagement = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Gestão de Perfis e Permissões</h3>
      <p className="text-muted-foreground mb-4">
        Gerencie quais perfis têm acesso a quais módulos do sistema e defina permissões específicas.
      </p>
      <PerfisPermissoes />
    </div>
  );
};

export default ProfilesManagement;
