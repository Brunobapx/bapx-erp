-- Criar tabelas para emissão de nota fiscal com Focus NFe

-- Tabela para configurações de nota fiscal
CREATE TABLE public.nota_configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_nota TEXT NOT NULL DEFAULT 'nfe',
  ambiente TEXT NOT NULL DEFAULT 'homologacao',
  token_focus TEXT NOT NULL,
  cnpj_emissor TEXT NOT NULL,
  regime_tributario TEXT DEFAULT '1',
  tipo_empresa TEXT DEFAULT 'MEI',
  cfop_padrao TEXT DEFAULT '5101',
  csosn_padrao TEXT DEFAULT '101',
  cst_padrao TEXT DEFAULT '00',
  icms_percentual NUMERIC DEFAULT 18,
  pis_percentual NUMERIC DEFAULT 1.65,
  cofins_percentual NUMERIC DEFAULT 7.6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para notas emitidas
CREATE TABLE public.notas_emitidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_nota TEXT NOT NULL,
  pedido_id UUID REFERENCES public.orders(id),
  focus_id TEXT,
  numero_nota TEXT,
  serie TEXT DEFAULT '1',
  chave_acesso TEXT,
  status TEXT DEFAULT 'processando',
  xml_url TEXT,
  pdf_url TEXT,
  json_enviado JSONB,
  json_resposta JSONB,
  emitida_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs da comunicação com Focus NFe
CREATE TABLE public.nota_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nota_id UUID REFERENCES public.notas_emitidas(id),
  acao TEXT NOT NULL,
  status_code INTEGER,
  mensagem TEXT,
  resposta JSONB,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.nota_configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_emitidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nota_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their own nota configurations" 
ON public.nota_configuracoes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notas emitidas" 
ON public.notas_emitidas 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view nota logs for their notes" 
ON public.nota_logs 
FOR SELECT 
USING (nota_id IN (SELECT id FROM public.notas_emitidas WHERE user_id = auth.uid()));

CREATE POLICY "System can insert nota logs" 
ON public.nota_logs 
FOR INSERT 
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_nota_configuracoes_user_id ON public.nota_configuracoes(user_id);
CREATE INDEX idx_notas_emitidas_user_id ON public.notas_emitidas(user_id);
CREATE INDEX idx_notas_emitidas_pedido_id ON public.notas_emitidas(pedido_id);
CREATE INDEX idx_nota_logs_nota_id ON public.nota_logs(nota_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_nota_configuracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nota_configuracoes_updated_at
  BEFORE UPDATE ON public.nota_configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_nota_configuracoes_updated_at();

CREATE OR REPLACE FUNCTION public.update_notas_emitidas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notas_emitidas_updated_at
  BEFORE UPDATE ON public.notas_emitidas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notas_emitidas_updated_at();