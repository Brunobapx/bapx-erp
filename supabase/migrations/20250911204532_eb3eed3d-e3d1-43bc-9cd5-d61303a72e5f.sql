-- Add unit_cost to product_recipes to persist ingredient costs per recipe item
ALTER TABLE public.product_recipes
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC NOT NULL DEFAULT 0;

-- Backfill existing recipe items with the current cost of each ingredient
UPDATE public.product_recipes pr
SET unit_cost = COALESCE(p.cost, 0)
FROM public.products p
WHERE pr.ingredient_id = p.id;