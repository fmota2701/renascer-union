-- Script para adicionar tabela player_selections ao Supabase
-- Esta tabela armazenará as seleções de jogadores em tempo real

-- Criar tabela player_selections
CREATE TABLE IF NOT EXISTS player_selections (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    is_selected BOOLEAN DEFAULT false,
    selected_by VARCHAR(255), -- Nome do admin que selecionou
    selected_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_player_selections_player_id ON player_selections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_selections_player_name ON player_selections(player_name);
CREATE INDEX IF NOT EXISTS idx_player_selections_is_selected ON player_selections(is_selected);
CREATE INDEX IF NOT EXISTS idx_player_selections_updated_at ON player_selections(updated_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_player_selections_updated_at 
    BEFORE UPDATE ON player_selections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Política RLS para permitir todas as operações
ALTER TABLE player_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on player_selections" 
    ON player_selections FOR ALL USING (true);

-- Função para sincronizar seleções com a tabela players
CREATE OR REPLACE FUNCTION sync_player_selection()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar status do jogador baseado na seleção
    IF NEW.is_selected = true THEN
        UPDATE players 
        SET status = 'selected'
        WHERE id = NEW.player_id;
    ELSE
        UPDATE players 
        SET status = 'active'
        WHERE id = NEW.player_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para sincronizar automaticamente
CREATE TRIGGER sync_player_selection_trigger
    AFTER INSERT OR UPDATE ON player_selections
    FOR EACH ROW EXECUTE FUNCTION sync_player_selection();

-- Inserir registros iniciais para jogadores existentes
INSERT INTO player_selections (player_id, player_name, is_selected)
SELECT id, name, false
FROM players
WHERE NOT EXISTS (
    SELECT 1 FROM player_selections ps WHERE ps.player_id = players.id
);

-- View para facilitar consultas
CREATE VIEW player_selections_view AS
SELECT 
    ps.id,
    ps.player_id,
    ps.player_name,
    ps.is_selected,
    ps.selected_by,
    ps.selected_at,
    ps.updated_at,
    p.status as player_status,
    p.total_items
FROM player_selections ps
JOIN players p ON ps.player_id = p.id
ORDER BY ps.updated_at DESC;

COMMIT;