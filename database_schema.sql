/*
  SISTEMA GS PRO - SCHEMA DO BANCO DE DADOS (SUGESTÃO)
  
  Este arquivo descreve a estrutura necessária para suportar as funcionalidades 
  implementadas no visual. Pode ser implementado no Supabase ou MySQL.
*/

-- TABELA DE PRODUTOS (SUCATAS E PEÇAS)
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  categoria TEXT,
  tipo TEXT CHECK (tipo IN ('sucata', 'peca')),
  preco_venda DECIMAL(10,2),
  unidade_medida TEXT, -- kg, un, etc
  estoque_atual DECIMAL(10,2) DEFAULT 0,
  estoque_minimo DECIMAL(10,2),
  localizacao TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE CLIENTES
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  documento TEXT UNIQUE, -- CPF ou CNPJ
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE VENDAS
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  vendedor_id UUID, -- Referência a tabela de perfis/usuários
  valor_total DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT,
  status TEXT DEFAULT 'concluida',
  data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITENS DA VENDA (RELACIONAMENTO N:N)
CREATE TABLE itens_venda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID REFERENCES vendas(id),
  produto_id UUID REFERENCES produtos(id),
  quantidade DECIMAL(10,2) NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL
);

-- TABELA DE TRANSAÇÕES FINANCEIRAS
CREATE TABLE transacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT,
  data_transacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  venda_id UUID REFERENCES vendas(id) -- Opcional, se a transação for de uma venda
);
