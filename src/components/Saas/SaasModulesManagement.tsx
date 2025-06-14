
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSaasModules } from "@/hooks/useSaasModules";
import { Plus, Puzzle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const SaasModulesManagement = () => {
  const { modules, loading } = useSaasModules();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Puzzle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Gestão de Módulos</h3>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Módulos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando módulos...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {modules.length === 0 && (
                <span className="text-muted-foreground">Nenhum módulo cadastrado.</span>
              )}
              {modules.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col border rounded-lg p-4 shadow-sm bg-muted/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{m.name}</span>
                    {m.is_core && (
                      <Badge variant="secondary" className="ml-2">Core</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{m.category}</div>
                  <div className="mb-2 text-sm">{m.description}</div>
                  <div className="text-xs text-muted-foreground">{m.route_path}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
