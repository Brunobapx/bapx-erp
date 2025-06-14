
-- 1. Configuração geral de comissão
CREATE TABLE public.commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  commission_type text NOT NULL DEFAULT 'percent',
  commission_value numeric NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Comissão por produto
CREATE TABLE public.product_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  commission_type text NOT NULL DEFAULT 'percent',
  commission_value numeric NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Comissões calculadas e histórico
CREATE TABLE public.salesperson_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id),
  salesperson_id uuid NOT NULL,
  commission_value numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_type text NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Histórico de pagamentos de comissão
CREATE TABLE public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES salesperson_commissions(id),
  amount numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  payment_method text,
  notes text
);

-- 5. Adicionar campo salesperson_id nas vendas e pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS salesperson_id uuid REFERENCES profiles(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS salesperson_id uuid REFERENCES profiles(id);

-- 6. Opcional: campo de comissão do produto no cadastro (se não existir)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'inherit';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS commission_value numeric;

-- Policies/RLS deverão ser configurados conforme já utilizado no projeto.
