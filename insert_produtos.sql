-- Execute este SQL no Supabase SQL Editor para inserir produtos de exemplo

INSERT INTO produtos (nome, sku, categoria, tipo, preco_venda, unidade_medida, estoque_atual, estoque_minimo, localizacao) VALUES
('Sucata Ferro Novo', 'SUC-FERRO-001', 'Metais Ferrosos', 'sucata', 1.50, 'kg', 500, 50, 'Galpão A'),
('Sucata Cobre Mel', 'SUC-COBRE-001', 'Metais Não-Ferrosos', 'sucata', 42.00, 'kg', 45, 10, 'Galpão B'),
('Sucata Alumínio', 'SUC-ALUM-001', 'Metais Não-Ferrosos', 'sucata', 8.50, 'kg', 120, 20, 'Galpão B'),
('Sucata Bronze', 'SUC-BRONZE-001', 'Metais Não-Ferrosos', 'sucata', 35.00, 'kg', 30, 5, 'Galpão B'),
('Sucata Latão', 'SUC-LATAO-001', 'Metais Não-Ferrosos', 'sucata', 28.00, 'kg', 60, 10, 'Galpão B'),
('Radiador Caminhão', 'PEC-RAD-001', 'Radiadores', 'peca', 250.00, 'un', 12, 2, 'Prateleira 1'),
('Alternador 12V', 'PEC-ALT-001', 'Peças Elétricas', 'peca', 180.00, 'un', 8, 2, 'Prateleira 2'),
('Motor de Arranque', 'PEC-MOT-001', 'Peças Elétricas', 'peca', 220.00, 'un', 5, 1, 'Prateleira 2'),
('Compressor Ar Condicionado', 'PEC-COMP-001', 'Ar Condicionado', 'peca', 350.00, 'un', 6, 1, 'Prateleira 3'),
('Catalisador Automóvel', 'PEC-CAT-001', 'Escapamento', 'peca', 450.00, 'un', 4, 1, 'Prateleira 4');
