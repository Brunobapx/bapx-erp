-- Adicionar número da troca à tabela trocas
ALTER TABLE public.trocas ADD COLUMN numero_troca TEXT;

-- Criar tabela para itens da troca (múltiplos produtos por troca)
CREATE TABLE public.troca_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  troca_id UUID NOT NULL REFERENCES public.trocas(id) ON DELETE CASCADE,
  produto_devolvido_id UUID NOT NULL REFERENCES public.products(id),
  produto_novo_id UUID NOT NULL REFERENCES public.products(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  observacoes_item TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_troca_itens_troca_id ON public.troca_itens(troca_id);
CREATE INDEX idx_troca_itens_produto_devolvido ON public.troca_itens(produto_devolvido_id);
CREATE INDEX idx_troca_itens_produto_novo ON public.troca_itens(produto_novo_id);

-- Habilitar RLS na nova tabela
ALTER TABLE public.troca_itens ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para troca_itens
CREATE POLICY "Authenticated users can manage all troca_itens"
ON public.troca_itens
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar trigger para updated_at na tabela troca_itens
CREATE TRIGGER update_troca_itens_updated_at
  BEFORE UPDATE ON public.troca_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para gerar número da troca
CREATE OR REPLACE FUNCTION public.set_troca_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_troca IS NULL OR NEW.numero_troca = '' THEN
    NEW.numero_troca := generate_sequence_number('TRC', 'trocas', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar número da troca automaticamente
CREATE TRIGGER set_troca_number_trigger
  BEFORE INSERT ON public.trocas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_troca_number();

-- Remover colunas antigas da tabela trocas (agora estarão na troca_itens)
ALTER TABLE public.trocas 
DROP COLUMN IF EXISTS produto_devolvido_id,
DROP COLUMN IF EXISTS produto_novo_id,
DROP COLUMN IF EXISTS quantidade;