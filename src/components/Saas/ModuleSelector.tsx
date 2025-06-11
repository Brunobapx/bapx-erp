
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSaasModules, SaasModule } from '@/hooks/useSaasModules';
import { Loader2 } from 'lucide-react';

interface ModuleSelectorProps {
  selectedModules: string[];
  onModulesChange: (moduleIds: string[]) => void;
  disabled?: boolean;
}

export const ModuleSelector = ({ selectedModules, onModulesChange, disabled = false }: ModuleSelectorProps) => {
  const { modules, loading } = useSaasModules();
  const [groupedModules, setGroupedModules] = useState<Record<string, SaasModule[]>>({});

  useEffect(() => {
    if (modules.length > 0) {
      const grouped = modules.reduce((acc, module) => {
        if (!acc[module.category]) {
          acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
      }, {} as Record<string, SaasModule[]>);
      setGroupedModules(grouped);
    }
  }, [modules]);

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (disabled) return;
    
    let newSelectedModules = [...selectedModules];
    
    if (checked) {
      if (!newSelectedModules.includes(moduleId)) {
        newSelectedModules.push(moduleId);
      }
    } else {
      newSelectedModules = newSelectedModules.filter(id => id !== moduleId);
    }
    
    onModulesChange(newSelectedModules);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando módulos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Módulos Inclusos no Plano</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(groupedModules).map(([category, categoryModules]) => (
          <Card key={category} className="p-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {categoryModules.map((module) => (
                <div key={module.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={(checked) => handleModuleToggle(module.id, checked as boolean)}
                    disabled={disabled || module.is_core}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={module.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {module.name}
                      </label>
                      {module.is_core && (
                        <Badge variant="secondary" className="text-xs">
                          Core
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
