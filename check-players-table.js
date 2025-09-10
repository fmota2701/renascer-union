const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlayersTable() {
  console.log('🔍 Verificando estrutura da tabela players...');
  
  try {
    // Tentar buscar um jogador para ver a estrutura
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao consultar tabela players:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📊 Estrutura da tabela players:');
      console.log('Colunas encontradas:', Object.keys(data[0]));
      console.log('\n📋 Exemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ Tabela players está vazia');
    }
    
    // Tentar adicionar coluna status se não existir
    console.log('\n🔧 Tentando adicionar coluna status...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE players ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';"
    });
    
    if (alterError) {
      console.log('⚠️ Não foi possível adicionar coluna via RPC:', alterError.message);
      console.log('💡 Você precisa executar este SQL manualmente no Supabase:');
      console.log("ALTER TABLE players ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';");
    } else {
      console.log('✅ Coluna status adicionada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkPlayersTable();