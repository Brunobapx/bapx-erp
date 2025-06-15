
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExtratoUploadProps {
  onFinish: () => void;
}

// Aceita .ofx, .csv, .txt, .ret
const ACCEPTS = ".ofx,.csv,.txt,.ret";

export default function ExtratoUpload({ onFinish }: ExtratoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    // For simplicity, support only CSV preview for MVP. 
    // OFX e CNAB serão aceitos como texto/plano para parsing futuro.
    setLoading(true);
    try {
      const text = await file.text();

      // CSV simples: data;descricao;valor;tipo (header opcional)
      const isCSV = file.name.endsWith(".csv");
      let transacoes: any[] = [];
      if (isCSV) {
        const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
        let skipHeader = false;
        if (rows[0].toLowerCase().includes("data") && rows[0].toLowerCase().includes("descricao")) skipHeader = true;
        for (let i = skipHeader ? 1 : 0; i < rows.length; i++) {
          const parts = rows[i].split(";").map(p => p.trim());
          if (parts.length < 4) continue;
          transacoes.push({
            data: parts[0]?.replace(/['"]+/g, ''),
            descricao: parts[1],
            valor: parts[2],
            tipo: parts[3].toLowerCase(), // credito ou debito
          });
        }
      } else {
        toast.error("Apenas CSV implementado nesta versão. Caso precise de OFX/CNAB, envie exemplo no suporte.");
        setLoading(false);
        return;
      }

      if (transacoes.length === 0) {
        toast.error("Nenhuma transação detectada no arquivo.");
        setLoading(false);
        return;
      }

      // Persistir no Supabase: extrato_bancario_importado
      for (const t of transacoes) {
        await supabase.from("extrato_bancario_importado").insert({
          data: t.data,
          descricao: t.descricao,
          valor: t.valor,
          tipo: t.tipo,
          status: "nao_conciliado",
          arquivo_origem: file.name,
        });
      }
      toast.success(`${transacoes.length} transações importadas!`);
      onFinish();
    } catch (err: any) {
      toast.error("Erro ao importar: " + err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
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
      <span className="ml-2 text-xs text-muted-foreground">
        (Apenas CSV simples implementado, OFX/CNAB em breve)
      </span>
    </div>
  );
}
