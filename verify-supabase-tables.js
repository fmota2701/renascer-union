const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requiredTables = [
  'players',
  'items', 
  'history',
  'system_config',
  'player_selections'
];

async function verifyTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Tabela '${tableName}': ${error.message}`);
      return false;
    }
    
    console.log(`✅ Tabela '${tableName}': OK`);
    return true;
  } catch (error) {
    console.log(`❌ Tabela '${tableName}': ${error.message}`);
    return false;
  }
}

async function verifyAllTables() {
  console.log('🔍 Verificando tabelas do Supabase...\n');
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    const exists = await verifyTable(table);
    if (!exists) {
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allTablesExist) {
    console.log('🎉 Todas as tabelas estão funcionando corretamente!');
    console.log('✅ O sistema está pronto para uso.');
    
    // Testar uma operação básica
    console.log('\n🧪 Testando operação básica...');
    try {
      const { data, error } = await supabase
        .from('player_selections')
        .insert({
          player_name: 'test_verification',
          is_selected: false,
          selected_by: 'system_test'
        })
        .select();
      
      if (error) {
        console.log('⚠️ Erro no teste de inserção:', error.message);
      } else {
        console.log('✅ Teste de inserção: OK');
        
        // Limpar o registro de teste
        await supabase
          .from('player_selections')
          .delete()
          .eq('player_name', 'test_verification');
        console.log('🧹 Registro de teste removido');
      }
    } catch (testError) {
      console.log('⚠️ Erro no teste:', testError.message);
    }
    
    return true;
  } else {
    console.log('❌ Algumas tabelas estão faltando ou com problemas.');
    console.log('\n📋 Para corrigir:');
    console.log('1. Acesse https://supabase.com/dashboard');
    console.log('2. Vá para seu projeto');
    console.log('3. Clique em "SQL Editor"');
    console.log('4. Execute o arquivo: complete-supabase-schema.sql');
    console.log('5. Execute este script novamente');
    return false;
  }
}

verifyAllTables().then(success => {
  process.exit(success ? 0 : 1);
});