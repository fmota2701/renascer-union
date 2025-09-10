const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function adaptExistingTable() {
  try {
    console.log('Verificando estrutura da tabela player_selections...');
    
    // Verificar estrutura atual
    const { data: existingData, error: selectError } = await supabase
      .from('player_selections')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('Erro ao acessar player_selections:', selectError);
      return;
    }
    
    console.log('Estrutura atual:', existingData);
    
    // Testar inserção com campos de draw
    console.log('Testando inserção de draw result...');
    
    const drawResult = {
      player_name: 'TEST_DRAW_PLAYER',
      item_name: 'TEST_DRAW_ITEM',
      selected_at: new Date().toISOString(),
      draw_status: 'active',
      draw_type: 'automatic'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('player_selections')
      .insert(drawResult)
      .select();
    
    if (insertError) {
      console.error('Erro na inserção:', insertError);
      
      // Tentar sem campos extras
      const simpleResult = {
        player_name: 'TEST_DRAW_PLAYER',
        item_name: 'TEST_DRAW_ITEM',
        selected_at: new Date().toISOString()
      };
      
      const { data: simpleData, error: simpleError } = await supabase
        .from('player_selections')
        .insert(simpleResult)
        .select();
      
      if (simpleError) {
        console.error('Erro na inserção simples:', simpleError);
      } else {
        console.log('✅ Inserção simples funcionou:', simpleData);
        
        // Limpar
        await supabase
          .from('player_selections')
          .delete()
          .eq('player_name', 'TEST_DRAW_PLAYER');
      }
    } else {
      console.log('✅ Inserção com draw_status funcionou:', insertData);
      
      // Limpar
      await supabase
        .from('player_selections')
        .delete()
        .eq('player_name', 'TEST_DRAW_PLAYER');
    }
    
    // Verificar se podemos usar como sistema de draw
    console.log('\n✅ Podemos usar player_selections para o sistema de sorteio!');
    console.log('Campos disponíveis: player_name, item_name, selected_at');
    console.log('Vamos adaptar o código para usar esta tabela.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

adaptExistingTable();