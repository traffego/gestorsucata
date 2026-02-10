-- Create categorias table
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all for now to match current project state, should be refined later)
CREATE POLICY "Enable all for anyone" ON public.categorias FOR ALL USING (true);

-- Migrate existing categories from produtos table
INSERT INTO public.categorias (nome)
SELECT DISTINCT categoria 
FROM public.produtos 
WHERE categoria IS NOT NULL 
ON CONFLICT (nome) DO NOTHING;
