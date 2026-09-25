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

-- POLÍTICAS DE ACESSO (idempotentes para reaplicação deste script)
DROP POLICY IF EXISTS "Public Read Networks" ON store_networks;
DROP POLICY IF EXISTS "Public Read Stores" ON stores;
DROP POLICY IF EXISTS "Public Read Products" ON products;
DROP POLICY IF EXISTS "Manage Own Lists" ON shopping_lists;
DROP POLICY IF EXISTS "Read own profile" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "Read catalog networks" ON store_networks;
DROP POLICY IF EXISTS "Authenticated manage networks" ON store_networks;
DROP POLICY IF EXISTS "Read catalog stores" ON stores;
DROP POLICY IF EXISTS "Authenticated manage stores" ON stores;
DROP POLICY IF EXISTS "Read catalog products" ON products;
DROP POLICY IF EXISTS "Authenticated manage products" ON products;
DROP POLICY IF EXISTS "Read owned or shared lists" ON shopping_lists;
DROP POLICY IF EXISTS "Create own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Update owned or shared lists" ON shopping_lists;
DROP POLICY IF EXISTS "Delete own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Read shares for accessible lists" ON shopping_list_shares;
DROP POLICY IF EXISTS "Owner manages shares" ON shopping_list_shares;
DROP POLICY IF EXISTS "Read items in accessible lists" ON shopping_list_items;
DROP POLICY IF EXISTS "Edit items in accessible lists" ON shopping_list_items;
DROP POLICY IF EXISTS "Manage own receipts" ON receipts;
DROP POLICY IF EXISTS "Manage items in own receipts" ON receipt_items;

CREATE POLICY "Read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Read catalog networks" ON store_networks FOR SELECT USING (true);
CREATE POLICY "Authenticated manage networks" ON store_networks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Read catalog stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Authenticated manage stores" ON stores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Read catalog products" ON products FOR SELECT USING (true);
CREATE POLICY "Authenticated manage products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Read owned or shared lists" ON shopping_lists FOR SELECT USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM shopping_list_shares s WHERE s.list_id = id AND s.user_id = auth.uid()));
CREATE POLICY "Create own lists" ON shopping_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Update owned or shared lists" ON shopping_lists FOR UPDATE USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM shopping_list_shares s WHERE s.list_id = id AND s.user_id = auth.uid() AND s.role = 'editor')) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Delete own lists" ON shopping_lists FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Read shares for accessible lists" ON shopping_list_shares FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM shopping_lists l WHERE l.id = list_id AND l.owner_id = auth.uid()));
CREATE POLICY "Owner manages shares" ON shopping_list_shares FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM shopping_lists l WHERE l.id = list_id AND l.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM shopping_lists l WHERE l.id = list_id AND l.owner_id = auth.uid()));

CREATE POLICY "Read items in accessible lists" ON shopping_list_items FOR SELECT USING (EXISTS (SELECT 1 FROM shopping_lists l LEFT JOIN shopping_list_shares s ON s.list_id = l.id AND s.user_id = auth.uid() WHERE l.id = list_id AND (l.owner_id = auth.uid() OR s.user_id IS NOT NULL)));
CREATE POLICY "Edit items in accessible lists" ON shopping_list_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM shopping_lists l LEFT JOIN shopping_list_shares s ON s.list_id = l.id AND s.user_id = auth.uid() WHERE l.id = list_id AND (l.owner_id = auth.uid() OR (s.user_id IS NOT NULL AND s.role = 'editor')))) WITH CHECK (EXISTS (SELECT 1 FROM shopping_lists l LEFT JOIN shopping_list_shares s ON s.list_id = l.id AND s.user_id = auth.uid() WHERE l.id = list_id AND (l.owner_id = auth.uid() OR (s.user_id IS NOT NULL AND s.role = 'editor'))));

CREATE POLICY "Manage own receipts" ON receipts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage items in own receipts" ON receipt_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM receipts r WHERE r.id = receipt_id AND r.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM receipts r WHERE r.id = receipt_id AND r.user_id = auth.uid()));

-- Acesso de leitura via token sem expor a enumeração de listas compartilhadas.
CREATE OR REPLACE FUNCTION get_shared_list(token TEXT) RETURNS SETOF shopping_lists LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT * FROM shopping_lists WHERE share_token = token LIMIT 1; $$;
REVOKE ALL ON FUNCTION get_shared_list(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_shared_list(TEXT) TO anon, authenticated;
CREATE OR REPLACE FUNCTION get_shared_list_items(token TEXT) RETURNS SETOF shopping_list_items LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT i.* FROM shopping_list_items i JOIN shopping_lists l ON l.id = i.list_id WHERE l.share_token = token ORDER BY i.created_at; $$;
REVOKE ALL ON FUNCTION get_shared_list_items(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_shared_list_items(TEXT) TO anon, authenticated;
