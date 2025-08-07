-- Criar tabela trocas (product exchanges)
CREATE TABLE public.trocas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_troca TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  responsible_user_id UUID,
  responsible_name TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  total_items INTEGER NOT NULL DEFAULT 0,
  observacoes_gerais TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by TEXT
);

-- Criar tabela para itens das trocas
CREATE TABLE public.troca_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  troca_id UUID NOT NULL REFERENCES public.trocas(id) ON DELETE CASCADE,
  produto_devolvido_id UUID NOT NULL,
  produto_devolvido_name TEXT NOT NULL,
  produto_novo_id UUID,
  produto_novo_name TEXT,
  quantidade INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  observacoes_item TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.trocas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.troca_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para trocas
CREATE POLICY "Authenticated users can manage all trocas" 
ON public.trocas 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "trocas_company_access" 
ON public.trocas 
FOR ALL 
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

-- Criar políticas RLS para troca_items
CREATE POLICY "Authenticated users can manage all troca items" 
ON public.troca_items 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "troca_items_company_access" 
ON public.troca_items 
FOR ALL 
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

-- Criar trigger para gerar número da troca automaticamente
CREATE TRIGGER set_troca_number_trigger
  BEFORE INSERT ON public.trocas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_troca_number();

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_trocas_updated_at
  BEFORE UPDATE ON public.trocas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_troca_items_updated_at
  BEFORE UPDATE ON public.troca_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();