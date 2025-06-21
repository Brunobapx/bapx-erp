
import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SystemModule } from '@/types/profiles';

interface ModulePermissionsProps {
  modules: SystemModule[];
  selectedModules: string[];
  onToggleModule: (moduleId: string) => void;
  isMasterProfile: boolean;
}

export const ModulePermissions = ({ 
  modules, 
  selectedModules, 
  onToggleModule, 
  isMasterProfile 
}: ModulePermissionsProps) => {
  // Agrupar módulos por categoria
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, SystemModule[]>);

  return (
    <div className="space-y-4">
      <Label>Módulos Permitidos</Label>
      <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto border rounded p-4">
        {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
          <div key={category} className="space-y-2">
            <h4 className="font-medium text-sm text-gray-600 uppercase">{category}</h4>
            <div className="grid grid-cols-2 gap-2">
              {categoryModules.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-module-${module.id}`}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => onToggleModule(module.id)}
                    disabled={isMasterProfile}
                  />
                  <Label htmlFor={`edit-module-${module.id}`} className="text-sm cursor-pointer">
                    {module.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
