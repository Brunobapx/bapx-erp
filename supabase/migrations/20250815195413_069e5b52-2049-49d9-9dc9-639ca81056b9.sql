-- Remove políticas conflitantes na tabela trocas
DROP POLICY IF EXISTS "Sellers can only view their own trocas" ON trocas;
DROP POLICY IF EXISTS "Sellers can only manage their own trocas" ON trocas;
DROP POLICY IF EXISTS "Sellers can only update their own trocas" ON trocas;
DROP POLICY IF EXISTS "Sellers can only delete their own trocas" ON trocas;

-- A política "Company isolation" já existe e é suficiente para isolamento por empresa
-- Esta política garante que cada empresa veja apenas suas próprias trocas