-- Criar tabela para resultados de sorteio em tempo real
CREATE TABLE IF NOT EXISTS draw_results (
    id SERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    draw_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos
CREATE POLICY "Allow read access for all users" ON draw_results
    FOR SELECT USING (true);

-- Política para permitir inserção para todos
CREATE POLICY "Allow insert access for all users" ON draw_results
    FOR INSERT WITH CHECK (true);

-- Política para permitir atualização para todos
CREATE POLICY "Allow update access for all users" ON draw_results
    FOR UPDATE USING (true);

-- Política para permitir exclusão para todos
CREATE POLICY "Allow delete access for all users" ON draw_results
    FOR DELETE USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_draw_results_updated_at
    BEFORE UPDATE ON draw_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_draw_results_status ON draw_results(status);
CREATE INDEX IF NOT EXISTS idx_draw_results_player ON draw_results(player_name);
CREATE INDEX IF NOT EXISTS idx_draw_results_item ON draw_results(item_name);
CREATE INDEX IF NOT EXISTS idx_draw_results_created_at ON draw_results(created_at DESC);