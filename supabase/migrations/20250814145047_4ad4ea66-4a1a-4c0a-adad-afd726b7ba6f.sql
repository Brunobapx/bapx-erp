-- Create system_settings table with proper structure
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  key TEXT NOT NULL,
  value TEXT,
  category TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT system_settings_company_key_unique UNIQUE (company_id, key)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company isolation
CREATE POLICY "Company can manage system settings"
ON public.system_settings
FOR ALL
USING (company_id = current_user_company_id())
WITH CHECK (company_id = current_user_company_id());

-- Add trigger to set company_id automatically
CREATE TRIGGER set_company_id_system_settings
  BEFORE INSERT ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- Add trigger to update updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();