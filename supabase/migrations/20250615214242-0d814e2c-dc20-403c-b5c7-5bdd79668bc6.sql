
-- Tabela principal de Ordens de Serviço
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_number TEXT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  technician_id UUID NOT NULL REFERENCES public.profiles(id),
  service_type TEXT NOT NULL CHECK (service_type IN ('Instalação', 'Manutenção', 'Suporte', 'Outros')),
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta')),
  status TEXT NOT NULL CHECK (status IN ('Aberta', 'Em andamento', 'Finalizada', 'Cancelada')) DEFAULT 'Aberta',
  contract_service BOOLEAN NOT NULL DEFAULT false,
  service_value NUMERIC,
  total_value NUMERIC,
  receivable_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL DEFAULT get_current_user_company_id()
);

-- Materiais utilizados na OS (relacionamento com produtos/estoque)
CREATE TABLE public.service_order_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC NOT NULL,
  unit_value NUMERIC,
  subtotal NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Anexos (imagens, arquivos)
CREATE TABLE public.service_order_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS e adicionar políticas mínimas
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura/escrita apenas para usuários vinculados (por exemplo, user_id, company_id)
CREATE POLICY "Usuários podem ler suas OS" ON public.service_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar suas OS" ON public.service_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas OS" ON public.service_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas OS" ON public.service_orders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver materiais da sua OS" ON public.service_order_materials FOR SELECT USING (
  service_order_id IN (SELECT id FROM public.service_orders WHERE user_id = auth.uid())
);
CREATE POLICY "Usuários podem inserir materiais da sua OS" ON public.service_order_materials FOR INSERT WITH CHECK (
  service_order_id IN (SELECT id FROM public.service_orders WHERE user_id = auth.uid())
);

CREATE POLICY "Usuários podem ver anexos da sua OS" ON public.service_order_attachments FOR SELECT USING (
  service_order_id IN (SELECT id FROM public.service_orders WHERE user_id = auth.uid())
);
CREATE POLICY "Usuários podem inserir anexos na sua OS" ON public.service_order_attachments FOR INSERT WITH CHECK (
  service_order_id IN (SELECT id FROM public.service_orders WHERE user_id = auth.uid())
);

-- Adicionar índice para busca por número da OS
CREATE INDEX idx_service_orders_os_number ON public.service_orders(os_number);

