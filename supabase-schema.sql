-- Schema do Supabase para Sistema de Distribuição de Itens
-- Estrutura do banco de dados para o sistema de distribuição de loot

-- Tabela de Jogadores
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    total_items INTEGER DEFAULT 0,
    last_distribution_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    faults INTEGER DEFAULT 0,
    total_received INTEGER DEFAULT 0,
    total_distributions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Itens
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    rarity VARCHAR(50),
    value INTEGER DEFAULT 0,
    description TEXT,
    available_quantity INTEGER DEFAULT 0,
    total_distributed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Histórico de Distribuições
CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    distribution_date TIMESTAMP DEFAULT NOW(),
    distribution_type VARCHAR(50) DEFAULT 'manual', -- manual, automatic, event
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Configurações do Sistema
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO system_config (key, value, description) VALUES
('max_items_per_distribution', '30', 'Máximo de itens por distribuição diária'),
('distributions_per_day', '2', 'Número de distribuições por dia'),
('last_sync_date', NULL, 'Data da última sincronização'),
('system_status', 'active', 'Status do sistema de distribuição');

-- Índices para performance
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_history_player_id ON history(player_id);
CREATE INDEX idx_history_item_id ON history(item_id);
CREATE INDEX idx_history_distribution_date ON history(distribution_date);
CREATE INDEX idx_system_config_key ON system_config(key);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar total_items do jogador quando há nova distribuição
CREATE OR REPLACE FUNCTION update_player_total_items()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE players 
        SET total_items = total_items + NEW.quantity,
            last_distribution_date = NEW.distribution_date
        WHERE id = NEW.player_id;
        
        UPDATE items
        SET total_distributed = total_distributed + NEW.quantity
        WHERE id = NEW.item_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE players 
        SET total_items = total_items - OLD.quantity
        WHERE id = OLD.player_id;
        
        UPDATE items
        SET total_distributed = total_distributed - OLD.quantity
        WHERE id = OLD.item_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_totals AFTER INSERT OR DELETE ON history
    FOR EACH ROW EXECUTE FUNCTION update_player_total_items();

-- Views úteis para relatórios
CREATE VIEW player_stats AS
SELECT 
    p.id,
    p.name,
    p.total_items,
    p.last_distribution_date,
    COUNT(h.id) as total_distributions,
    p.status,
    p.created_at
FROM players p
LEFT JOIN history h ON p.id = h.player_id
GROUP BY p.id, p.name, p.total_items, p.last_distribution_date, p.status, p.created_at;

CREATE VIEW item_stats AS
SELECT 
    i.id,
    i.name,
    i.category,
    i.rarity,
    i.available_quantity,
    i.total_distributed,
    COUNT(h.id) as distribution_count,
    i.created_at
FROM items i
LEFT JOIN history h ON i.id = h.item_id
GROUP BY i.id, i.name, i.category, i.rarity, i.available_quantity, i.total_distributed, i.created_at;

CREATE VIEW recent_distributions AS
SELECT 
    h.id,
    p.name as player_name,
    i.name as item_name,
    h.quantity,
    h.distribution_date,
    h.distribution_type,
    h.notes
FROM history h
JOIN players p ON h.player_id = p.id
JOIN items i ON h.item_id = i.id
ORDER BY h.distribution_date DESC;

-- Políticas RLS (Row Level Security) - opcional para segurança
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Política básica - permitir todas as operações (ajustar conforme necessário)
CREATE POLICY "Allow all operations" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON history FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON system_config FOR ALL USING (true);