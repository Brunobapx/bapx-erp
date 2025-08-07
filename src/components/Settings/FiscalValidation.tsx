import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface FiscalValidationProps {
  settings: any;
}

export const FiscalValidation: React.FC<FiscalValidationProps> = ({ settings }) => {
  const taxRegime = settings.tax_regime;
  const isSimplesToNacional = taxRegime === "1" || taxRegime === "2";
  
  const validationResults = [];
  
  // Validações comuns
  if (!settings.company_name) {
    validationResults.push({
      level: 'error',
      message: 'Razão Social da empresa é obrigatória'
    });
  }
  
  if (!settings.company_cnpj) {
    validationResults.push({
      level: 'error', 
      message: 'CNPJ da empresa é obrigatório'
    });
  }
  
  if (!settings.default_cfop) {
    validationResults.push({
      level: 'error',
      message: 'CFOP padrão é obrigatório'
    });
  }
  
  if (!settings.default_ncm) {
    validationResults.push({
      level: 'error',
      message: 'NCM padrão é obrigatório'
    });
  }
  
  // Validações específicas por regime
  if (isSimplesToNacional) {
    if (!settings.csosn_padrao) {
      validationResults.push({
        level: 'error',
        message: 'CSOSN padrão é obrigatório para Simples Nacional'
      });
    }
    
    if (!settings.empresa_tipo) {
      validationResults.push({
        level: 'warning',
        message: 'Tipo de empresa recomendado para Simples Nacional'
      });
    }
    
    // Verificar se não está configurando impostos que não se aplicam
    if (Number(settings.pis_aliquota) > 0 || Number(settings.cofins_aliquota) > 0) {
      validationResults.push({
        level: 'warning',
        message: 'Simples Nacional não recolhe PIS/COFINS separadamente. As alíquotas configuradas serão ignoradas.'
      });
    }
    
    validationResults.push({
      level: 'success',
      message: 'Configuração correta para Simples Nacional - CSOSN será usado ao invés de CST'
    });
    
  } else {
    // Regime Normal
    if (!settings.cst_padrao && !settings.icms_cst) {
      validationResults.push({
        level: 'error',
        message: 'CST padrão é obrigatório para Regime Normal'
      });
    }
    
    if (!settings.pis_cst) {
      validationResults.push({
        level: 'error',
        message: 'CST PIS é obrigatório para Regime Normal'
      });
    }
    
    if (!settings.cofins_cst) {
      validationResults.push({
        level: 'error',
        message: 'CST COFINS é obrigatório para Regime Normal'
      });
    }
    
    if (!settings.pis_aliquota || Number(settings.pis_aliquota) === 0) {
      validationResults.push({
        level: 'warning',
        message: 'Alíquota PIS deve ser configurada para Regime Normal'
      });
    }
    
    if (!settings.cofins_aliquota || Number(settings.cofins_aliquota) === 0) {
      validationResults.push({
        level: 'warning',
        message: 'Alíquota COFINS deve ser configurada para Regime Normal'
      });
    }
    
    validationResults.push({
      level: 'success',
      message: 'Configuração para Regime Normal - CST e alíquotas manuais serão aplicadas'
    });
  }
  
  // Validações da Focus NFe
  if (settings.focus_nfe_enabled) {
    if (!settings.focus_nfe_token) {
      validationResults.push({
        level: 'error',
        message: 'Token Focus NFe é obrigatório quando a emissão está habilitada'
      });
    }
    
    if (!settings.nota_fiscal_ambiente) {
      validationResults.push({
        level: 'warning',
        message: 'Ambiente de emissão não configurado'
      });
    }
  }
  
  const errorCount = validationResults.filter(r => r.level === 'error').length;
  const warningCount = validationResults.filter(r => r.level === 'warning').length;
  const successCount = validationResults.filter(r => r.level === 'success').length;
  
  const getIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return null;
    }
  };
  
  const getAlertVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'success': return 'default';
      default: return 'default';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="font-medium">Status da Configuração Fiscal</h4>
        <Badge variant={taxRegime === "1" || taxRegime === "2" ? "secondary" : "outline"}>
          {isSimplesToNacional ? 'Simples Nacional' : 'Regime Normal'}
        </Badge>
      </div>
      
      <div className="flex gap-4 mb-4">
        {errorCount > 0 && (
          <Badge variant="destructive">
            {errorCount} Erro{errorCount > 1 ? 's' : ''}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="secondary">
            {warningCount} Aviso{warningCount > 1 ? 's' : ''}
          </Badge>
        )}
        {successCount > 0 && (
          <Badge variant="outline" className="border-green-200 text-green-700">
            {successCount} OK
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        {validationResults.map((result, index) => (
          <Alert key={index} variant={getAlertVariant(result.level)}>
            <div className="flex items-center gap-2">
              {getIcon(result.level)}
              <AlertDescription className="flex-1">
                {result.message}
              </AlertDescription>
            </div>
          </Alert>
        ))}
      </div>
      
      {errorCount === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Configuração fiscal válida! As NFe podem ser emitidas com essas configurações.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};