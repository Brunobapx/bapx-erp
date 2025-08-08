-- 1) Tabela de sequências por empresa
CREATE TABLE IF NOT EXISTS public.company_sequences (
  company_id uuid NOT NULL,
  sequence_key text NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, sequence_key)
);

-- Proteger a tabela contra acesso direto (somente via funções SECURITY DEFINER)
ALTER TABLE public.company_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no direct access" ON public.company_sequences;
CREATE POLICY "no direct access" ON public.company_sequences FOR ALL
  USING (false)
  WITH CHECK (false);

-- 2) Nova implementação por empresa da função generate_sequence_number
DROP FUNCTION IF EXISTS public.generate_sequence_number(text, text, uuid);
CREATE OR REPLACE FUNCTION public.generate_sequence_number(prefix text, table_name text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  company uuid;
  seq_key text;
  new_number integer;
  formatted text;
  number_column text;
BEGIN
  -- Descobrir empresa do usuário
  SELECT company_id INTO company FROM public.profiles WHERE id = user_id;

  -- Chave de sequência = nome da tabela (mantém simples)
  seq_key := table_name;

  IF company IS NULL THEN
    -- Compatibilidade: se usuário não tiver empresa, usa sequência global existente
    IF table_name = 'orders' THEN
      SELECT COALESCE(MAX(CAST(order_number AS INTEGER)), 0) + 1
      INTO new_number
      FROM public.orders 
      WHERE order_number ~ '^\d+$';
      RETURN LPAD(new_number::TEXT, 6, '0');
    ELSE
      -- Detectar coluna do número
      number_column := CASE 
        WHEN table_name = 'production' THEN 'production_number'
        WHEN table_name = 'packaging' THEN 'packaging_number'
        WHEN table_name = 'sales' THEN 'sale_number'
        WHEN table_name = 'financial_entries' THEN 'entry_number'
        WHEN table_name = 'delivery_routes' THEN 'route_number'
        WHEN table_name = 'service_orders' THEN 'os_number'
        WHEN table_name = 'commission_payments' THEN 'payment_number'
        WHEN table_name = 'trocas' THEN 'numero_troca'
        WHEN table_name = 'fiscal_invoices' THEN 'invoice_number'
        WHEN table_name = 'notas_emitidas' THEN 'numero_nota'
      END;
      EXECUTE format(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)$'') AS INTEGER)), 0) + 1 FROM public.%I',
        number_column, prefix, table_name
      ) INTO new_number;
      RETURN prefix || '-' || LPAD(new_number::TEXT, 3, '0');
    END IF;
  END IF;

  -- Incremento atômico por empresa + tabela
  INSERT INTO public.company_sequences(company_id, sequence_key, last_number)
  VALUES (company, seq_key, 1)
  ON CONFLICT (company_id, sequence_key)
  DO UPDATE SET last_number = public.company_sequences.last_number + 1
  RETURNING last_number INTO new_number;

  -- Formatação por tipo
  IF table_name = 'orders' THEN
    formatted := LPAD(new_number::TEXT, 6, '0');
  ELSE
    formatted := prefix || '-' || LPAD(new_number::TEXT, 3, '0');
  END IF;

  RETURN formatted;
END;
$$;

-- 3) Atualizar função de pedidos para usar a nova sequência por empresa
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_sequence_number('', 'orders', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Funções para NF (fiscal_invoices e notas_emitidas) com sequência por empresa
CREATE OR REPLACE FUNCTION public.set_fiscal_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_sequence_number('NFE', 'fiscal_invoices', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_notas_emitidas_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.numero_nota IS NULL OR NEW.numero_nota = '' THEN
    NEW.numero_nota := public.generate_sequence_number('NFE', 'notas_emitidas', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 5) Criar (ou recriar) TRIGGERS nas tabelas para definir as numerações automaticamente
-- Pedidos
DROP TRIGGER IF EXISTS before_insert_orders_set_number ON public.orders;
CREATE TRIGGER before_insert_orders_set_number
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- Produção
DROP TRIGGER IF EXISTS before_insert_production_set_number ON public.production;
CREATE TRIGGER before_insert_production_set_number
BEFORE INSERT ON public.production
FOR EACH ROW EXECUTE FUNCTION public.set_production_number();

-- Embalagem
DROP TRIGGER IF EXISTS before_insert_packaging_set_number ON public.packaging;
CREATE TRIGGER before_insert_packaging_set_number
BEFORE INSERT ON public.packaging
FOR EACH ROW EXECUTE FUNCTION public.set_packaging_number();

-- Vendas
DROP TRIGGER IF EXISTS before_insert_sales_set_number ON public.sales;
CREATE TRIGGER before_insert_sales_set_number
BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.set_sale_number();

-- Lançamentos financeiros
DROP TRIGGER IF EXISTS before_insert_financial_set_number ON public.financial_entries;
CREATE TRIGGER before_insert_financial_set_number
BEFORE INSERT ON public.financial_entries
FOR EACH ROW EXECUTE FUNCTION public.set_entry_number();

-- Rotas de entrega
DROP TRIGGER IF EXISTS before_insert_routes_set_number ON public.delivery_routes;
CREATE TRIGGER before_insert_routes_set_number
BEFORE INSERT ON public.delivery_routes
FOR EACH ROW EXECUTE FUNCTION public.set_route_number();

-- Ordem de Serviço
DROP TRIGGER IF EXISTS before_insert_service_orders_set_number ON public.service_orders;
CREATE TRIGGER before_insert_service_orders_set_number
BEFORE INSERT ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.set_os_number();

-- Pagamentos de Comissão
DROP TRIGGER IF EXISTS before_insert_commission_payments_set_number ON public.commission_payments;
CREATE TRIGGER before_insert_commission_payments_set_number
BEFORE INSERT ON public.commission_payments
FOR EACH ROW EXECUTE FUNCTION public.set_commission_payment_number();

-- Trocas
DROP TRIGGER IF EXISTS before_insert_trocas_set_number ON public.trocas;
CREATE TRIGGER before_insert_trocas_set_number
BEFORE INSERT ON public.trocas
FOR EACH ROW EXECUTE FUNCTION public.set_troca_number();

-- Fiscal Invoices (NFe)
DROP TRIGGER IF EXISTS before_insert_fiscal_invoices_set_number ON public.fiscal_invoices;
CREATE TRIGGER before_insert_fiscal_invoices_set_number
BEFORE INSERT ON public.fiscal_invoices
FOR EACH ROW EXECUTE FUNCTION public.set_fiscal_invoice_number();

-- Notas emitidas (histórico)
DROP TRIGGER IF EXISTS before_insert_notas_emitidas_set_number ON public.notas_emitidas;
CREATE TRIGGER before_insert_notas_emitidas_set_number
BEFORE INSERT ON public.notas_emitidas
FOR EACH ROW EXECUTE FUNCTION public.set_notas_emitidas_number();