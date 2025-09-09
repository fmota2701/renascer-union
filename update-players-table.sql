-- Script para atualizar a tabela players com as colunas necessárias

-- Adicionar coluna faults se não existir
ALTER TABLE players ADD COLUMN IF NOT EXISTS faults INTEGER DEFAULT 0;

-- Adicionar coluna total_received se não existir
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_received INTEGER DEFAULT 0;

-- Adicionar coluna total_distributions se não existir
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_distributions INTEGER DEFAULT 0;

-- Atualizar valores existentes se necessário
UPDATE players SET faults = 0 WHERE faults IS NULL;
UPDATE players SET total_received = 0 WHERE total_received IS NULL;
UPDATE players SET total_distributions = 0 WHERE total_distributions IS NULL;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;