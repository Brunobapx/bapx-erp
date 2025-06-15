
// Configuração do Supabase Client
// ATENÇÃO: Utilize APENAS keys anônimas (anon/public) neste arquivo e nunca exponha chaves service_role ou privadas.
// Para máxima segurança, armazene essas chaves em variáveis de ambiente protegidas do Supabase.

/*
  O Supabase recomenda o uso de variáveis de ambiente para chaves tanto em frontend quanto em edge functions.
  Este arquivo deve ser alterado APENAS se seu ambiente frontend realmente requer acesso público.
  A chave anon pode ser encontrada e alterada no painel do Supabase:
  Dashboard → [Seu Projeto] → Settings → API → Project API keys → anon public
  
  Documentação: https://supabase.com/docs/guides/api
*/

import { createClient } from '@supabase/supabase-js';

// Supabase client initialization (apenas para uso no frontend)
// Em edge functions, utilize secrets!
export const supabase = createClient(
  // Se preferir, substitua por variáveis de ambiente (caso exista integração automatizada)
  'https://gtqmwlxzszttzriswoxj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cW13bHh6c3p0dHpyaXN3b3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzUwMjUsImV4cCI6MjA2MzM1MTAyNX0.03XyZCOF5UnUUaNpn44-MlQW0J6Vfo3_rb7mhE7D-Bk',
  {
    auth: {
      // Garante persistência e atualização automática do token para melhor UX
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

