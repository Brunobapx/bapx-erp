
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingState: React.FC = () => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Usuários do Sistema</h4>
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
};
