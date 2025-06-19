
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

interface CompanyStatusCheckProps {
  children: React.ReactNode;
}

interface CompanyInfo {
  name: string;
  status: string;
  vencimento?: string;
  plano_id?: string;
}

export const CompanyStatusCheck = ({ children }: CompanyStatusCheckProps) => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCompanyStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Buscar informações da empresa do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            company_id,
            companies!inner(
              name,
              status,
              vencimento,
              plano_id
            )
          `)
          .eq('id', user.id)
          .single();

        if (profile?.companies) {
          const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies;
          setCompanyInfo({
            name: company.name,
            status: company.status,
            vencimento: company.vencimento,
            plano_id: company.plano_id
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status da empresa:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCompanyStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Verificando status da empresa...</p>
        </div>
      </div>
    );
  }

  // Verificar se empresa está inativa
  if (companyInfo?.status !== 'active') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A empresa "{companyInfo?.name}" está inativa. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verificar se plano está vencido
  const today = new Date();
  const vencimento = companyInfo?.vencimento ? new Date(companyInfo.vencimento) : null;
  
  if (vencimento && vencimento < today) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            O plano da empresa "{companyInfo?.name}" está vencido desde {vencimento.toLocaleDateString()}. 
            Entre em contato com o administrador para renovar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
