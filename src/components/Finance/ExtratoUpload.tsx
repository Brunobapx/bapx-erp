
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExtratoUploadProps {
  onFinish: () => void;
}

const ACCEPTS = ".ofx,.csv,.txt,.ret";

export default function ExtratoUpload({ onFinish }: ExtratoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // Função para converter data para formato ISO
  const parseDate = (dateStr: string): string => {
    const cleanDate = dateStr.replace(/['"]/g, '').trim();
    
    // Tentar diferentes formatos
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = cleanDate.match(format);
      if (match) {
        if (format === formats[0] || format === formats[2]) {
          // DD/MM/YYYY ou DD-MM-YYYY
          const [, day, month, year] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          // YYYY-MM-DD
          return cleanDate;
        }
      }
    }
    
    // Fallback: tentar usar como está
    return cleanDate;
  };

  // Função para converter valor monetário
  const parseValue = (valueStr: string): number => {
    const cleanValue = valueStr.replace(/['"]/g, '').trim();
    
    // Remover pontos de milhares e trocar vírgula por ponto
    let numericValue = cleanValue
      .replace(/\./g, '') // Remove pontos de milhares
      .replace(',', '.'); // Troca vírgula decimal por ponto
    
    const parsed = parseFloat(numericValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const text = await file.text();
      console.log('Conteúdo do arquivo:', text.substring(0, 200));

      const isCSV = file.name.endsWith(".csv");
      let transacoes: any[] = [];
      
      if (isCSV) {
        const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
        console.log('Total de linhas:', rows.length);
        
        let skipHeader = false;
        if (rows.length > 0 && rows[0].toLowerCase().includes("data")) {
          skipHeader = true;
          console.log('Header detectado:', rows[0]);
        }
        
        for (let i = skipHeader ? 1 : 0; i < rows.length; i++) {
          const parts = rows[i].split(";").map(p => p.trim());
          console.log(`Linha ${i}:`, parts);
          
          if (parts.length < 3) {
            console.log(`Linha ${i} ignorada - poucos campos:`, parts);
            continue;
          }
          
          try {
            const transacao = {
              data: parseDate(parts[0]),
              descricao: parts[1] || 'Descrição não informada',
              valor: parseValue(parts[2]),
              tipo: parts[3] ? parts[3].toLowerCase() : 'debito',
            };
            
            console.log('Transação processada:', transacao);
            
            // Validar se a transação tem dados mínimos
            if (transacao.data && transacao.descricao && transacao.valor !== 0) {
              transacoes.push(transacao);
            } else {
              console.log('Transação inválida ignorada:', transacao);
            }
          } catch (err) {
            console.error(`Erro ao processar linha ${i}:`, err, parts);
          }
        }
      } else {
        toast.error("Apenas CSV implementado nesta versão. Formato: data;descrição;valor;tipo");
        setLoading(false);
        return;
      }

      if (transacoes.length === 0) {
        toast.error("Nenhuma transação válida detectada no arquivo. Verifique o formato: data;descrição;valor;tipo");
        setLoading(false);
        return;
      }

      console.log('Transações para inserir:', transacoes);

      // Inserir transações no banco
      let sucessos = 0;
      for (const t of transacoes) {
        try {
          const { error } = await supabase
            .from("extrato_bancario_importado")
            .insert({
              user_id: user.id,
              data: t.data,
              descricao: t.descricao,
              valor: t.valor,
              tipo: t.tipo,
              status: "nao_conciliado",
              arquivo_origem: file.name,
            });
          
          if (error) {
            console.error('Erro ao inserir transação:', error, t);
          } else {
            sucessos++;
          }
        } catch (err) {
          console.error('Erro inesperado ao inserir:', err, t);
        }
      }
      
      if (sucessos > 0) {
        toast.success(`${sucessos} transações importadas com sucesso!`);
        onFinish();
      } else {
        toast.error("Nenhuma transação foi importada. Verifique o formato do arquivo.");
      }
      
    } catch (err: any) {
      console.error("Erro ao importar arquivo:", err);
      toast.error("Erro ao importar: " + err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTS}
        className="hidden"
        onChange={handleFile}
        disabled={loading}
      />
      <Button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Importando..." : "Importar Extrato (.CSV)"}
      </Button>
      <div className="text-xs text-muted-foreground">
        <p>Formato CSV esperado: data;descrição;valor;tipo</p>
        <p>Exemplo: 01/12/2024;Pagamento Cliente;1500,50;credito</p>
      </div>
    </div>
  );
}
