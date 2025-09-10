-- Script para desabilitar RLS e permitir acesso público aos dados

-- Desabilitar RLS em todas as tabelas
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE history DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_config DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow all operations" ON players;
DROP POLICY IF EXISTS "Allow all operations" ON items;
DROP POLICY IF EXISTS "Allow all operations" ON history;
DROP POLICY IF EXISTS "Allow all operations" ON system_config;

-- Garantir que as tabelas sejam acessíveis publicamente
GRANT ALL ON players TO anon, authenticated;
GRANT ALL ON items TO anon, authenticated;
GRANT ALL ON history TO anon, authenticated;
GRANT ALL ON system_config TO anon, authenticated;

-- Garantir acesso às sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;