-- TABELAS PRINCIPAIS DO MERCADOLISTA SUPABASE

-- Configuração da tabela de Usuários / Perfis vinculada ao auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Redes de Lojas (Ex: Rede Zaffari, Carrefour, Pão de Açúcar)
CREATE TABLE IF NOT EXISTS store_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Lojas Específicas
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID REFERENCES store_networks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  store_type TEXT NOT NULL DEFAULT 'Mercado', -- Mercado, Farmácia, Padaria, etc.
  address TEXT,
  city TEXT,
  state CHAR(2) DEFAULT 'RS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  unit TEXT DEFAULT 'un', -- un, kg, g, l, ml
  image_url TEXT, -- Salva APENAS URL direta conforme requisito
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Listas de Compras
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  budget NUMERIC(10, 2) DEFAULT 0.00,
  share_token TEXT UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Compartilhamento de Listas (Permissão para qualquer usuário com o link/convite)
CREATE TABLE IF NOT EXISTS shopping_list_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor', -- 'editor' por padrão conforme requisito
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- Tabela de Itens da Lista de Compras
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) DEFAULT 1,
  estimated_price NUMERIC(10, 2) DEFAULT 0.00,
  actual_price NUMERIC(10, 2) DEFAULT 0.00,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'Geral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Notas Fiscais (NFC-e)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  access_key TEXT UNIQUE,
  url TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  state CHAR(2) DEFAULT 'RS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Itens da Nota Fiscal
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity NUMERIC(10, 2) DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HABILITAR RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO
CREATE POLICY "Public Read Networks" ON store_networks FOR SELECT USING (true);
CREATE POLICY "Public Read Stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);

CREATE POLICY "Manage Own Lists" ON shopping_lists FOR ALL USING (auth.uid() = owner_id);
