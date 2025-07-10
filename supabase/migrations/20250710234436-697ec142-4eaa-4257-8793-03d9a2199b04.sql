-- Criar tabela para controle de comissões geradas
CREATE TABLE public.commission_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  seller_name TEXT NOT NULL,
  payment_number TEXT NOT NULL,
  total_commission NUMERIC NOT NULL DEFAULT 0,
  order_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  commission_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  accounts_payable_id UUID,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage commission payments" 
ON public.commission_payments 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to generate payment numbers
CREATE OR REPLACE FUNCTION public.set_commission_payment_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
    NEW.payment_number := generate_sequence_number('COM', 'commission_payments', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for payment numbers
CREATE TRIGGER set_commission_payment_number_trigger
  BEFORE INSERT ON public.commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_commission_payment_number();