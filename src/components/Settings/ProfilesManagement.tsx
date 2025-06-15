
import React from "react";
import RoleModulePermissions from "./RoleModulePermissions";

const ProfilesManagement = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Permissões dos Perfis</h3>
      <p className="text-muted-foreground mb-4">
        Gerencie quais perfis (roles) têm acesso a quais módulos do sistema.
      </p>
      <RoleModulePermissions />
    </div>
  );
};

export default ProfilesManagement;
