-- Corrigir o salesperson_id do pedido PED-002 para vincular ao Thor
UPDATE orders 
SET salesperson_id = '50813b14-8b0c-40cf-a55c-76bf2a4a19b1'
WHERE order_number = 'PED-002' AND seller = 'Thor Albuquerque';