-- Criar tabela de cargos/posições de usuários
CREATE TABLE public.user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  position TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seu próprio cargo"
  ON public.user_positions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todos os cargos"
  ON public.user_positions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Service role pode gerenciar cargos"
  ON public.user_positions
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Criar enum para padronizar os cargos
CREATE TYPE public.user_position_type AS ENUM (
  'vendedor',
  'administrativo', 
  'entregador',
  'gerente',
  'financeiro',
  'producao',
  'estoque'
);

-- Alterar a tabela para usar o enum
ALTER TABLE public.user_positions 
ALTER COLUMN position TYPE user_position_type USING position::user_position_type;