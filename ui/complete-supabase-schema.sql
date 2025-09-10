-- Schema Completo do Supabase para Sistema de Distribuição de Itens
-- Execute este SQL no Supabase SQL Editor para criar todas as tabelas necessárias

-- Primeiro, vamos remover as políticas RLS existentes se houver
DO $$ 
BEGIN
    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Allow all operations on players" ON players;
    DROP POLICY IF EXISTS "Allow all operations on items" ON items;
    DROP POLICY IF EXISTS "Allow all operations on history" ON history;
    DROP POLICY IF EXISTS "Allow all operations on system_config" ON system_config;
    DROP POLICY IF EXISTS "Allow all operations on player_selections" ON player_selections;
EXCEPTION
    WHEN undefined_table THEN
        -- Tabelas não existem ainda, continuar
        NULL;
END $$;

-- Tabela de Jogadores
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    total_items INTEGER DEFAULT 0,
    last_distribution_date TIMESTAMP,

    faults INTEGER DEFAULT 0,
    total_received INTEGER DEFAULT 0,
    total_distributions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Itens
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,

    total_distributed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Histórico de Distribuições
CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,

    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Seleções de Jogadores (para sincronização realtime)
CREATE TABLE IF NOT EXISTS player_selections (
    id SERIAL PRIMARY KEY,
    player_id INTEGER,
    player_name VARCHAR(255) NOT NULL,
    is_selected BOOLEAN DEFAULT false,
    selected_by VARCHAR(255),
    selected_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir configurações padrão (apenas se não existirem)
INSERT INTO system_config (key, value, description) 
SELECT 'max_items_per_distribution', '30', 'Máximo de itens por distribuição diária'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE key = 'max_items_per_distribution');

INSERT INTO system_config (key, value, description) 
SELECT 'distributions_per_day', '2', 'Número de distribuições por dia'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE key = 'distributions_per_day');

INSERT INTO system_config (key, value, description) 
SELECT 'last_sync_date', NULL, 'Data da última sincronização'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE key = 'last_sync_date');

INSERT INTO system_config (key, value, description) 
SELECT 'system_status', 'active', 'Status do sistema de distribuição'
WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE key = 'system_status');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);


CREATE INDEX IF NOT EXISTS idx_history_player_id ON history(player_id);
CREATE INDEX IF NOT EXISTS idx_history_item_id ON history(item_id);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
CREATE INDEX IF NOT EXISTS idx_player_selections_player_id ON player_selections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_selections_player_name ON player_selections(player_name);
CREATE INDEX IF NOT EXISTS idx_player_selections_is_selected ON player_selections(is_selected);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas (com verificação de existência)
DO $$ 
BEGIN
    -- Triggers para players
    DROP TRIGGER IF EXISTS update_players_updated_at ON players;
    CREATE TRIGGER update_players_updated_at
        BEFORE UPDATE ON players
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Triggers para items
    DROP TRIGGER IF EXISTS update_items_updated_at ON items;
    CREATE TRIGGER update_items_updated_at
        BEFORE UPDATE ON items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Triggers para system_config
    DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
    CREATE TRIGGER update_system_config_updated_at
        BEFORE UPDATE ON system_config
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Triggers para player_selections
    DROP TRIGGER IF EXISTS update_player_selections_updated_at ON player_selections;
    CREATE TRIGGER update_player_selections_updated_at
        BEFORE UPDATE ON player_selections
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Habilitar Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_selections ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DO $$ 
BEGIN
    -- Criar ou substituir políticas RLS
    DROP POLICY IF EXISTS "Allow all operations on players" ON players;
    CREATE POLICY "Allow all operations on players" 
    ON players FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow all operations on items" ON items;
    CREATE POLICY "Allow all operations on items" 
    ON items FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow all operations on history" ON history;
    CREATE POLICY "Allow all operations on history" 
    ON history FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow all operations on system_config" ON system_config;
    CREATE POLICY "Allow all operations on system_config" 
    ON system_config FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow all operations on player_selections" ON player_selections;
    CREATE POLICY "Allow all operations on player_selections" 
    ON player_selections FOR ALL USING (true);
END $$;

-- Comentários para documentação
COMMENT ON TABLE players IS 'Tabela de jogadores do sistema';
COMMENT ON TABLE items IS 'Tabela de itens disponíveis para distribuição';
COMMENT ON TABLE history IS 'Histórico de distribuições de itens';
COMMENT ON TABLE system_config IS 'Configurações do sistema';
COMMENT ON TABLE player_selections IS 'Seleções de jogadores para sincronização realtime';

-- Finalização
SELECT 'Schema criado com sucesso! Todas as tabelas, índices, triggers e políticas RLS foram configurados.' as message;