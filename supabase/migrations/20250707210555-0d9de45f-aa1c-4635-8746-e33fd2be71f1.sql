-- Inserir role de admin para o usuário atual se não existir
-- Assumindo que o usuário logado é o primeiro admin do sistema
INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'admin'::user_type
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid()
);