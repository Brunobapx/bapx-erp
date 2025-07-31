-- Temporariamente desabilitar RLS para debugging do problema de autenticação
-- Isso vai nos ajudar a confirmar se o problema é realmente de autenticação

-- Desabilitar RLS temporariamente para orders
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS temporariamente para order_items
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;