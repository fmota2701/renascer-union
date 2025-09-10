-- Adicionar coluna status à tabela players
ALTER TABLE players ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Atualizar todos os jogadores existentes para ter status 'active'
UPDATE players SET status = 'active' WHERE status IS NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'status';

-- Mostrar alguns registros para verificar
SELECT id, name, status, created_at FROM players LIMIT 5;