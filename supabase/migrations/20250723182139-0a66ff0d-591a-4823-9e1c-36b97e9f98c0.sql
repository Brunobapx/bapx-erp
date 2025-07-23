-- Corrigir política RLS para notas_emitidas - permitir que todos os usuários autenticados vejam todas as notas
DROP POLICY IF EXISTS "Users can manage their own notas emitidas" ON public.notas_emitidas;

-- Nova política: todos os usuários autenticados podem ver e gerenciar todas as notas emitidas
CREATE POLICY "Authenticated users can manage all notas emitidas"
  ON public.notas_emitidas
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verificar se as outras tabelas relacionadas também precisam de ajuste
-- Nota: as tabelas trocas e troca_itens já estão corretas