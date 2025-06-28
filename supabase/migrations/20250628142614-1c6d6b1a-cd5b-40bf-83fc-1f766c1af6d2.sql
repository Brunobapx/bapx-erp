
-- Adicionar constraint única para prevenir lançamentos duplicados
-- Primeiro, vamos limpar possíveis duplicatas existentes
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY sale_id, user_id, type 
    ORDER BY 
      CASE WHEN description LIKE '%-%-%' THEN 1 ELSE 2 END,
      created_at DESC
  ) as rn
  FROM financial_entries
  WHERE sale_id IS NOT NULL
)
DELETE FROM financial_entries 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar constraint única para prevenir duplicatas futuras
ALTER TABLE financial_entries 
ADD CONSTRAINT unique_sale_financial_entry 
UNIQUE (sale_id, user_id, type);

-- Adicionar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_financial_entries_sale_user 
ON financial_entries (sale_id, user_id, type);
