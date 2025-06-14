
import React from "react";
import { Building } from "lucide-react";

export const SaasPageHeader: React.FC = () => (
  <div className="flex items-center gap-3 mb-6">
    <Building className="h-8 w-8 text-primary" />
    <h1 className="text-3xl font-bold">Gestão SaaS</h1>
  </div>
);
