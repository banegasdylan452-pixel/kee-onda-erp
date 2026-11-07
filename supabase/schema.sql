-- ==============================================================================
-- KEE ONDA CRM / ERP - SUPABASE DATABASE SCHEMA
-- Ejecuta este script en el "SQL Editor" de tu proyecto de Supabase.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE CATEGORÍAS
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#ef4444',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE PROVEEDORES
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  contact TEXT,
  email TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT,
  cost_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 5,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- 5. TABLA DE CLIENTES (CRM / FIAR)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  debt NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 20000,
  notes TEXT,
  last_payment_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABLA DE VENTAS (POS)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT now(),
  total_amount NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL,
  customer_name TEXT DEFAULT 'Consumidor Final',
  cashier TEXT,
  received_cash NUMERIC DEFAULT 0,
  change_cash NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (date);

-- 7. TABLA DE ITEMS DE VENTA
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  quantity NUMERIC DEFAULT 1,
  subtotal NUMERIC DEFAULT 0,
  subcost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id);

-- 8. TABLA DE FINANZAS (INGRESOS Y EGRESOS)
CREATE TABLE IF NOT EXISTS finances (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'egreso')),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  cost_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Efectivo',
  date TIMESTAMPTZ DEFAULT now(),
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finances_date ON finances (date);
CREATE INDEX IF NOT EXISTS idx_finances_type ON finances (type);

-- 9. TABLA DE CONTROL DE CAJA / TURNOS
CREATE TABLE IF NOT EXISTS cash_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open BOOLEAN DEFAULT true,
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  initial_cash NUMERIC DEFAULT 0,
  counted_cash NUMERIC,
  cashier TEXT,
  notes TEXT,
  closing_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;

-- 11. POLÍTICAS DE ACCESO PÚBLICO (ANON & AUTHENTICATED)
CREATE POLICY "Permitir todo en categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en finances" ON finances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en cash_shifts" ON cash_shifts FOR ALL USING (true) WITH CHECK (true);

-- 12. HABILITAR TIEMPO REAL (REALTIME)
ALTER PUBLICATION supabase_realtime ADD TABLE categories, suppliers, products, customers, sales, sale_items, finances, cash_shifts;

