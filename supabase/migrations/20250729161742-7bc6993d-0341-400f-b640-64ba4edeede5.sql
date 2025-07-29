-- Criar tabela para histórico de backups
CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('manual', 'automatic', 'restore')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  size_bytes BIGINT,
  total_records INTEGER,
  location TEXT DEFAULT 'local' CHECK (location IN ('local', 'google_drive')),
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Criar políticas para backup_history
CREATE POLICY "Authenticated users can manage backup history"
ON public.backup_history
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_backup_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backup_history_updated_at
  BEFORE UPDATE ON public.backup_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_backup_history_updated_at();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON public.backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_type ON public.backup_history(type);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON public.backup_history(status);