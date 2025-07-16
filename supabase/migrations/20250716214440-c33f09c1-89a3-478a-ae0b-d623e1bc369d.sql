-- Criar tabela de trocas
CREATE TABLE public.trocas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clients(id),
  produto_devolvido_id UUID NOT NULL REFERENCES public.products(id),
  produto_novo_id UUID NOT NULL REFERENCES public.products(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo TEXT NOT NULL,
  data_troca TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responsavel TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de perdas para controle
CREATE TABLE public.perdas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  produto_id UUID NOT NULL REFERENCES public.products(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo TEXT NOT NULL,
  custo_estimado NUMERIC(10,2),
  data_perda TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referencia_troca_id UUID REFERENCES public.trocas(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.trocas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perdas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para trocas
CREATE POLICY "Authenticated users can manage all trocas"
ON public.trocas
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar políticas RLS para perdas
CREATE POLICY "Authenticated users can manage all perdas"
ON public.perdas
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
CREATE TRIGGER update_trocas_updated_at
  BEFORE UPDATE ON public.trocas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_perdas_updated_at
  BEFORE UPDATE ON public.perdas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_trocas_cliente_id ON public.trocas(cliente_id);
CREATE INDEX idx_trocas_produto_devolvido_id ON public.trocas(produto_devolvido_id);
CREATE INDEX idx_trocas_produto_novo_id ON public.trocas(produto_novo_id);
CREATE INDEX idx_trocas_data_troca ON public.trocas(data_troca);
CREATE INDEX idx_trocas_user_id ON public.trocas(user_id);

CREATE INDEX idx_perdas_produto_id ON public.perdas(produto_id);
CREATE INDEX idx_perdas_data_perda ON public.perdas(data_perda);
CREATE INDEX idx_perdas_referencia_troca_id ON public.perdas(referencia_troca_id);
CREATE INDEX idx_perdas_user_id ON public.perdas(user_id);