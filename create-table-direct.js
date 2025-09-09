const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPlayerSelectionsTable() {
  console.log('🚀 Criando tabela player_selections...');
  
  try {
    // Primeiro, vamos tentar inserir um registro de teste para forçar a criação da tabela
    console.log('📝 Tentando criar tabela via insert...');
    
    const { data, error } = await supabase
      .from('player_selections')
      .insert({
        player_name: 'test_player',
        is_selected: false,
        selected_by: 'system'
      })
      .select();
    
    if (error) {
      console.log('❌ Tabela não existe. Você precisa criar manualmente no Supabase.');
      console.log('\n=== EXECUTE NO SUPABASE SQL EDITOR ===\n');
      console.log(`CREATE TABLE IF NOT EXISTS player_selections (
  id SERIAL PRIMARY KEY,
  player_id INTEGER,
  player_name VARCHAR(255) NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  selected_by VARCHAR(255),
  selected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_player_selections_player_id ON player_selections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_selections_player_name ON player_selections(player_name);
CREATE INDEX IF NOT EXISTS idx_player_selections_is_selected ON player_selections(is_selected);

-- Habilitar RLS (Row Level Security)
ALTER TABLE player_selections ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY IF NOT EXISTS "Allow all operations on player_selections" 
ON player_selections FOR ALL 
USING (true);`);
      console.log('\n=== FIM DO SQL ===\n');
      
      console.log('📋 Passos para criar a tabela:');
      console.log('1. Acesse https://supabase.com/dashboard');
      console.log('2. Vá para seu projeto');
      console.log('3. Clique em "SQL Editor" no menu lateral');
      console.log('4. Cole o SQL acima e execute');
      console.log('5. Execute este script novamente');
      
      return false;
    }
    
    console.log('✅ Tabela player_selections existe!');
    
    // Remover o registro de teste
    if (data && data.length > 0) {
      await supabase
        .from('player_selections')
        .delete()
        .eq('player_name', 'test_player');
      console.log('🧹 Registro de teste removido');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

createPlayerSelectionsTable().then(success => {
  if (success) {
    console.log('🎉 Tabela player_selections está pronta!');
    process.exit(0);
  } else {
    console.log('❌ Tabela precisa ser criada manualmente!');
    process.exit(1);
  }
});