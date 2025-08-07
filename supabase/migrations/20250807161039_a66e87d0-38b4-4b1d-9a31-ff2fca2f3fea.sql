-- Criar foreign key entre order_items e products
ALTER TABLE public.order_items 
ADD CONSTRAINT fk_order_items_product_id 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;