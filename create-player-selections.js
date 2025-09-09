const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPlayerSelectionsTable() {
  console.log('🚀 Verificando se tabela player_selections existe...');
  
  try {
    // Primeiro, vamos tentar verificar se a tabela já existe
    const { data: existingData, error: checkError } = await supabase
      .from('player_selections')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Tabela player_selections já existe!');
      
      // Verificar se há dados
      const { data: allData, error: countError } = await supabase
        .from('player_selections')
        .select('id');
        
      if (!countError && allData) {
        console.log(`📊 Encontrados ${allData.length} registros na tabela.`);
        return true;
      }
    }
    
    console.log('⚠️ Tabela player_selections não existe ou está vazia.');
    console.log('📝 Por favor, execute o seguinte SQL manualmente no Supabase SQL Editor:');
    console.log('\n--- COPIE E COLE NO SUPABASE SQL EDITOR ---');
    console.log(`
CREATE TABLE IF NOT EXISTS player_selections (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  selected_by VARCHAR(255),
  selected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_player_selections_player_id ON player_selections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_selections_player_name ON player_selections(player_name);
CREATE INDEX IF NOT EXISTS idx_player_selections_is_selected ON player_selections(is_selected);

-- RLS
ALTER TABLE player_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all operations on player_selections" ON player_selections FOR ALL USING (true);
`);
    console.log('--- FIM DO SQL ---\n');
    
    // Aguardar um pouco para o usuário executar o SQL
    console.log('⏳ Aguardando 10 segundos para você executar o SQL...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Tentar novamente após o usuário executar
    const { data: newCheck, error: newCheckError } = await supabase
      .from('player_selections')
      .select('id')
      .limit(1);
      
    if (newCheckError) {
      console.error('❌ Tabela ainda não existe. Execute o SQL manualmente no Supabase.');
      return false;
    }
    
    console.log('✅ Tabela encontrada! Inserindo dados iniciais...');
    
    // Inserir dados iniciais dos jogadores existentes
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name');
      
    if (playersError) {
      console.error('❌ Erro ao buscar jogadores:', playersError);
      return false;
    }
    
    if (players && players.length > 0) {
      const selectionsData = players.map(player => ({
        player_id: player.id,
        player_name: player.name,
        is_selected: false
      }));
      
      const { error: insertError } = await supabase
        .from('player_selections')
        .upsert(selectionsData, { onConflict: 'player_id' });
        
      if (insertError) {
        console.error('❌ Erro ao inserir seleções iniciais:', insertError);
        return false;
      }
      
      console.log(`✅ ${players.length} seleções iniciais criadas!`);
    }
    
    console.log('🎉 Tabela player_selections configurada com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar
createPlayerSelectionsTable()
  .then(success => {
    if (success) {
      console.log('✅ Configuração concluída!');
      process.exit(0);
    } else {
      console.error('❌ Falha na configuração!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });