-- Script para criar tabelas de itens liberados e seleções de jogadores
-- Execute este SQL no Supabase SQL Editor

-- Tabela para armazenar itens liberados pelo admin
CREATE TABLE IF NOT EXISTS released_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    released_by VARCHAR(255) NOT NULL, -- Nome do admin que liberou
    released_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active', -- active, distributed, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para registrar seleções dos jogadores
CREATE TABLE IF NOT EXISTS player_item_selections (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    released_item_id INTEGER REFERENCES released_items(id) ON DELETE CASCADE,
    selected_at TIMESTAMP DEFAULT NOW(),
    priority INTEGER DEFAULT 1, -- Ordem de prioridade da seleção (1 = mais desejado)
    status VARCHAR(50) DEFAULT 'pending', -- pending, distributed, cancelled
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_released_items_status ON released_items(status);
CREATE INDEX IF NOT EXISTS idx_released_items_released_at ON released_items(released_at);
CREATE INDEX IF NOT EXISTS idx_player_item_selections_player_name ON player_item_selections(player_name);
CREATE INDEX IF NOT EXISTS idx_player_item_selections_released_item_id ON player_item_selections(released_item_id);
CREATE INDEX IF NOT EXISTS idx_player_item_selections_status ON player_item_selections(status);
CREATE INDEX IF NOT EXISTS idx_player_item_selections_selected_at ON player_item_selections(selected_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para released_items
DROP TRIGGER IF EXISTS update_released_items_updated_at ON released_items;
CREATE TRIGGER update_released_items_updated_at
    BEFORE UPDATE ON released_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE released_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_item_selections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir todas as operações
DROP POLICY IF EXISTS "Allow all operations on released_items" ON released_items;
CREATE POLICY "Allow all operations on released_items" 
    ON released_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on player_item_selections" ON player_item_selections;
CREATE POLICY "Allow all operations on player_item_selections" 
    ON player_item_selections FOR ALL USING (true);

-- Comentários para documentação
COMMENT ON TABLE released_items IS 'Tabela para armazenar itens liberados pelo admin para seleção dos jogadores';
COMMENT ON TABLE player_item_selections IS 'Tabela para registrar as seleções/escolhas dos jogadores nos itens liberados';

-- Finalização
SELECT 'Tabelas released_items e player_item_selections criadas com sucesso!' as message;