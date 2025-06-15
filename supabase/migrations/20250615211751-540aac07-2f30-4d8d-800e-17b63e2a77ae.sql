
-- Criação da tabela para transações importadas do extrato bancário
CREATE TABLE public.extrato_bancario_importado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL, -- 'credito' ou 'debito'
  status TEXT NOT NULL DEFAULT 'nao_conciliado', -- 'nao_conciliado', 'conciliado', 'em_processamento', etc
  arquivo_origem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Apenas permite acessar seus próprios extratos importados
ALTER TABLE public.extrato_bancario_importado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Extrato: só acessa do usuário" 
  ON public.extrato_bancario_importado
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Extrato: só insere do usuário" 
  ON public.extrato_bancario_importado
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Extrato: só atualiza do usuário" 
  ON public.extrato_bancario_importado
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Extrato: só deleta do usuário" 
  ON public.extrato_bancario_importado
  FOR DELETE USING (user_id = auth.uid());

-- Criação da tabela de conciliações
CREATE TABLE public.conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_transacao_banco UUID NOT NULL REFERENCES public.extrato_bancario_importado(id) ON DELETE CASCADE,
  id_lancamento_interno UUID NOT NULL,
  tipo_lancamento TEXT NOT NULL, -- ex: 'conta_a_pagar', 'conta_a_receber', 'fluxo_caixa'
  metodo_conciliacao TEXT NOT NULL, -- ex: 'automatico', 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Só acessa conciliações que referenciam transações do usuário
ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conciliação: só acessa do usuário" 
  ON public.conciliacoes
  FOR SELECT USING (
    id_transacao_banco IN (
      SELECT id FROM public.extrato_bancario_importado WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Conciliação: só insere do usuário" 
  ON public.conciliacoes
  FOR INSERT WITH CHECK (
    id_transacao_banco IN (
      SELECT id FROM public.extrato_bancario_importado WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Conciliação: só atualiza do usuário" 
  ON public.conciliacoes
  FOR UPDATE USING (
    id_transacao_banco IN (
      SELECT id FROM public.extrato_bancario_importado WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Conciliação: só deleta do usuário" 
  ON public.conciliacoes
  FOR DELETE USING (
    id_transacao_banco IN (
      SELECT id FROM public.extrato_bancario_importado WHERE user_id = auth.uid()
    )
  );
