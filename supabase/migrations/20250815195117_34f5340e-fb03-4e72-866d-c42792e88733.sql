-- Remove a política conflitante que permite acesso a todos os fornecedores
DROP POLICY IF EXISTS "Authenticated users can manage all vendors" ON vendors;

-- Confirma que só temos a política de isolamento por empresa
-- A política "Company isolation" já existe e está correta