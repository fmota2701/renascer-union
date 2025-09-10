const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  try {
    console.log('Verificando todas as tabelas disponíveis...');
    
    // Tentar diferentes tabelas que podem existir
    const tablesToCheck = [
      'player_selections',
      'players', 
      'items',
      'item_distribution',
      'user_selections'
    ];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n--- Verificando tabela: ${tableName} ---`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Erro ao acessar ${tableName}:`, error.message);
      } else {
        console.log(`✅ Tabela ${tableName} existe!`);
        if (data && data.length > 0) {
          console.log('Estrutura (primeiro registro):', Object.keys(data[0]));
          console.log('Exemplo de dados:', data[0]);
        } else {
          console.log('Tabela vazia, tentando inserção de teste...');
          
          // Tentar inserção básica para descobrir campos
          const testData = { test: 'test' };
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(testData);
          
          if (insertError) {
            console.log('Erro na inserção teste:', insertError.message);
          }
        }
      }
    }
    
    // Verificar se existe alguma tabela relacionada a draw/sorteio
    console.log('\n--- Buscando por tabelas de sorteio ---');
    const drawTables = ['draws', 'draw_results', 'lottery', 'sorteio'];
    
    for (const tableName of drawTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ Encontrada tabela de sorteio: ${tableName}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableStructure();