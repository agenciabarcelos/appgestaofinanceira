
-- LIMPEZA (OPCIONAL - Cuidado se já houver dados)
-- DROP TABLE IF EXISTS transactions;
-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS access_requests;

-- 1. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PAYABLE', 'RECEIVABLE')),
    icon TEXT DEFAULT 'Tag',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    dueDate DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PAYABLE', 'RECEIVABLE')),
    categoryId UUID REFERENCES categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'RECEIVED', 'OVERDUE')),
    recurrenceId UUID, -- Agrupador de parcelas/recorrências
    installment INTEGER,
    totalInstallments INTEGER,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. TABELA DE SOLICITAÇÕES DE ACESSO (ADMIN)
CREATE TABLE IF NOT EXISTS access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    approved BOOLEAN DEFAULT false
);

-- 4. HABILITAR SEGURANÇA DE NÍVEL DE LINHA (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS PARA CATEGORIAS
CREATE POLICY "Usuários podem ver suas próprias categorias" 
ON categories FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias categorias" 
ON categories FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias categorias" 
ON categories FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias categorias" 
ON categories FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 6. POLÍTICAS PARA TRANSAÇÕES
CREATE POLICY "Usuários podem ver seus próprios lançamentos" 
ON transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios lançamentos" 
ON transactions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios lançamentos" 
ON transactions FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios lançamentos" 
ON transactions FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 7. POLÍTICAS PARA ACCESS_REQUESTS
-- CORREÇÃO: Permitir inserção anônima para solicitações de acesso
CREATE POLICY "Qualquer um pode solicitar acesso" 
ON access_requests FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Permitir que o sistema leia se um e-mail está aprovado durante o login (anon precisa ler via RPC ou filtro simples se RLS permitir)
CREATE POLICY "Permitir leitura pública limitada de status de aprovação"
ON access_requests FOR SELECT
TO anon, authenticated
USING (true);

-- 8. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, dueDate);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
