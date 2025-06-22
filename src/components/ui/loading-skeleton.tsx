
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'list' | 'form';
  rows?: number;
  className?: string;
}

export const LoadingSkeleton = ({ 
  type = 'table', 
  rows = 5, 
  className = '' 
}: LoadingSkeletonProps) => {
  if (type === 'table') {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-label="Carregando dados">
        {/* Table header */}
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
        
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex space-x-4">
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[80px]" />
          </div>
        ))}
        
        <span className="sr-only">Carregando tabela de dados...</span>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`space-y-4 ${className}`} role="status" aria-label="Carregando cartões">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-[60px]" />
              <Skeleton className="h-6 w-[80px]" />
            </div>
          </div>
        ))}
        <span className="sr-only">Carregando cartões de informação...</span>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-label="Carregando lista">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
        <span className="sr-only">Carregando lista de itens...</span>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className={`space-y-4 ${className}`} role="status" aria-label="Carregando formulário">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <span className="sr-only">Carregando formulário...</span>
      </div>
    );
  }

  return null;
};
