const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function discoverPlayerSelections() {
  try {
    console.log('Descobrindo estrutura da tabela player_selections...');
    
    // Tentar inserir com diferentes combinações de campos
    const testCombinations = [
      { player_id: 1, item_id: 1 },
      { player_name: 'Test', item_name: 'Test Item' },
      { name: 'Test', item: 'Test Item' },
      { player: 'Test', item: 'Test Item' },
      { user_id: 1, item_id: 1 },
      { selection_id: 1, selected: true }
    ];
    
    for (const combination of testCombinations) {
      console.log(`\nTestando combinação:`, combination);
      
      const { data, error } = await supabase
        .from('player_selections')
        .insert(combination)
        .select();
      
      if (error) {
        console.log('❌ Erro:', error.message);
      } else {
        console.log('✅ Sucesso! Estrutura descoberta:', data);
        
        // Limpar o teste
        if (data && data.length > 0) {
          await supabase
            .from('player_selections')
            .delete()
            .eq('id', data[0].id);
        }
        break;
      }
    }
    
    // Como alternativa, vamos criar nossa própria tabela de sorteio
    console.log('\n--- Criando tabela de sorteio usando estrutura conhecida ---');
    
    // Vamos usar a tabela players como base para criar registros de sorteio
    console.log('Testando inserção na tabela players para simular sorteio...');
    
    const drawPlayer = {
      name: `DRAW_${Date.now()}`,
      total_received: 0,
      faults: 0,
      total_distributions: 0
    };
    
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert(drawPlayer)
      .select();
    
    if (playerError) {
      console.error('Erro ao criar player de sorteio:', playerError);
    } else {
      console.log('✅ Player de sorteio criado:', playerData);
      
      // Agora vamos usar este player como referência para sorteios
      const playerId = playerData[0].id;
      
      // Simular um sorteio ativo
      const { data: updateData, error: updateError } = await supabase
        .from('players')
        .update({ 
          name: `DRAW_ACTIVE_${playerId}`,
          total_received: 1 // Usar como flag de sorteio ativo
        })
        .eq('id', playerId)
        .select();
      
      if (updateError) {
        console.error('Erro ao atualizar sorteio:', updateError);
      } else {
        console.log('✅ Sorteio ativo simulado:', updateData);
      }
      
      // Limpar
      await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
      
      console.log('✅ Teste limpo');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

discoverPlayerSelections();