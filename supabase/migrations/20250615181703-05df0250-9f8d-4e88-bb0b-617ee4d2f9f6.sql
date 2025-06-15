
-- Função de auditoria genérica
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(TG_TABLE_NAME || '_CREATED', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(TG_TABLE_NAME || '_UPDATED', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(TG_TABLE_NAME || '_DELETED', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Criação dos triggers de auditoria para as principais tabelas:

-- Tabela: clients
DROP TRIGGER IF EXISTS audit_clients_trigger ON public.clients;
CREATE TRIGGER audit_clients_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: orders
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: products
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: vendors
DROP TRIGGER IF EXISTS audit_vendors_trigger ON public.vendors;
CREATE TRIGGER audit_vendors_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: sales
DROP TRIGGER IF EXISTS audit_sales_trigger ON public.sales;
CREATE TRIGGER audit_sales_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: purchases
DROP TRIGGER IF EXISTS audit_purchases_trigger ON public.purchases;
CREATE TRIGGER audit_purchases_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: financial_entries
DROP TRIGGER IF EXISTS audit_financial_entries_trigger ON public.financial_entries;
CREATE TRIGGER audit_financial_entries_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.financial_entries
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: user_roles
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Tabela: profiles
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();
