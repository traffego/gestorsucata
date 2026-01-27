import { createClient } from '@supabase/supabase-js'

// Estas variáveis devem ser configuradas no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima'

// O cliente do Supabase será usado para as futuras integrações
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/*
  DICA DE USO:
  Para buscar produtos:
  const { data, error } = await supabase.from('produtos').select('*')
*/
