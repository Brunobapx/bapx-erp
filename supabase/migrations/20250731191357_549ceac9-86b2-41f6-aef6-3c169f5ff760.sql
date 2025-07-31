-- Desativar temporariamente o trigger handle_order_flow que está causando conflitos
DROP TRIGGER IF EXISTS order_flow_trigger ON orders;

-- Desativar também o trigger de auditoria temporariamente para testes
DROP TRIGGER IF EXISTS audit_orders_trigger ON orders;