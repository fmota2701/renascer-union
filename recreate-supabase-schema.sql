-- Script para recriar completamente o schema do Supabase
-- Executar no SQL Editor do Supabase

-- 1. Excluir tabelas existentes (se existirem)
DROP TABLE IF EXISTS history CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- 2. Criar tabela de jogadores
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    total_received INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de itens
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    total_distributed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de histórico
CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices para performance
CREATE INDEX idx_history_player_id ON history(player_id);
CREATE INDEX idx_history_item_id ON history(item_id);
CREATE INDEX idx_history_created_at ON history(created_at);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_items_name ON items(name);

-- 6. Função para atualizar totais automaticamente
CREATE OR REPLACE FUNCTION update_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar total do jogador
    UPDATE players 
    SET total_received = (
        SELECT COALESCE(SUM(quantity), 0) 
        FROM history 
        WHERE player_id = NEW.player_id
    ),
    updated_at = NOW()
    WHERE id = NEW.player_id;
    
    -- Atualizar total do item
    UPDATE items 
    SET total_distributed = (
        SELECT COALESCE(SUM(quantity), 0) 
        FROM history 
        WHERE item_id = NEW.item_id
    ),
    updated_at = NOW()
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para atualizar totais quando histórico é deletado
CREATE OR REPLACE FUNCTION update_totals_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar total do jogador
    UPDATE players 
    SET total_received = (
        SELECT COALESCE(SUM(quantity), 0) 
        FROM history 
        WHERE player_id = OLD.player_id
    ),
    updated_at = NOW()
    WHERE id = OLD.player_id;
    
    -- Atualizar total do item
    UPDATE items 
    SET total_distributed = (
        SELECT COALESCE(SUM(quantity), 0) 
        FROM history 
        WHERE item_id = OLD.item_id
    ),
    updated_at = NOW()
    WHERE id = OLD.item_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar triggers
CREATE TRIGGER trigger_update_totals_insert
    AFTER INSERT ON history
    FOR EACH ROW
    EXECUTE FUNCTION update_totals();

CREATE TRIGGER trigger_update_totals_update
    AFTER UPDATE ON history
    FOR EACH ROW
    EXECUTE FUNCTION update_totals();

CREATE TRIGGER trigger_update_totals_delete
    AFTER DELETE ON history
    FOR EACH ROW
    EXECUTE FUNCTION update_totals_on_delete();

-- 9. Habilitar RLS (Row Level Security) se necessário
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas permissivas para desenvolvimento
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on items" ON items FOR ALL USING (true);
CREATE POLICY "Allow all operations on history" ON history FOR ALL USING (true);

-- 11. Inserir dados de teste
INSERT INTO players (name) VALUES 
    ('Teste Visualização'),
    ('João Silva'),
    ('Maria Santos');

INSERT INTO items (name) VALUES 
    ('Teste Item'),
    ('Poção de Vida'),
    ('Espada Mágica');

-- Comentários:
-- Este script recria completamente o schema do banco
-- Remove qualquer dependência de cache local
-- Garante que os totais sejam sempre calculados automaticamente
-- Inclui índices para melhor performance
-- Políticas RLS permissivas para desenvolvimento