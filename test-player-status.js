const fetch = require('node-fetch');

// Configuração
const API_BASE = 'https://renascer-union.netlify.app/.netlify/functions/supabase-api';

async function testPlayerStatus() {
  console.log('🧪 Testando correção do status dos jogadores...');
  
  try {
    // 1. Buscar jogadores atuais
    console.log('\n📋 Buscando jogadores atuais...');
    const playersResponse = await fetch(`${API_BASE}/players`);
    
    if (!playersResponse.ok) {
      throw new Error(`Erro HTTP ${playersResponse.status}: ${playersResponse.statusText}`);
    }
    
    const playersData = await playersResponse.json();
    console.log('📊 Resposta da API:', JSON.stringify(playersData, null, 2));
    
    // A API retorna diretamente os dados, não em um wrapper success/data
    const players = playersData.players || playersData;
    console.log(`✅ Encontrados ${players.length} jogadores`);
    
    // Mostrar status atual dos jogadores
    players.forEach(player => {
      console.log(`   - ${player.name}: ${player.active ? 'ATIVO' : 'INATIVO'} (status: ${player.status || 'undefined'})`);
    });
    
    if (players.length === 0) {
      console.log('⚠️ Nenhum jogador encontrado para testar');
      return;
    }
    
    // 2. Testar atualização de status para inativo
    const testPlayer = players[0];
    console.log(`\n🔄 Testando atualização de status para ${testPlayer.name}...`);
    
    console.log('   Marcando como INATIVO...');
    const updateResponse1 = await fetch(`${API_BASE}/players/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerName: testPlayer.name,
        active: false
      })
    });
    
    const updateResult1 = await updateResponse1.json();
    if (!updateResult1.success) {
      throw new Error('Erro ao marcar jogador como inativo: ' + updateResult1.error);
    }
    
    console.log('   ✅ Jogador marcado como inativo');
    console.log('   📊 Status retornado:', updateResult1.player.status);
    
    // 3. Verificar se a mudança foi persistida
    console.log('\n🔍 Verificando se a mudança foi persistida...');
    const verifyResponse1 = await fetch(`${API_BASE}/players`);
    const verifyData1 = await verifyResponse1.json();
    
    const updatedPlayer1 = verifyData1.data.players.find(p => p.name === testPlayer.name);
    console.log(`   Status no banco: ${updatedPlayer1.status}`);
    console.log(`   Propriedade active: ${updatedPlayer1.active}`);
    
    if (updatedPlayer1.active === false && updatedPlayer1.status === 'inactive') {
      console.log('   ✅ Status inativo persistido corretamente!');
    } else {
      console.log('   ❌ Status inativo NÃO foi persistido corretamente');
    }
    
    // 4. Testar atualização de status para ativo
    console.log('\n   Marcando como ATIVO novamente...');
    const updateResponse2 = await fetch(`${API_BASE}/players/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerName: testPlayer.name,
        active: true
      })
    });
    
    const updateResult2 = await updateResponse2.json();
    if (!updateResult2.success) {
      throw new Error('Erro ao marcar jogador como ativo: ' + updateResult2.error);
    }
    
    console.log('   ✅ Jogador marcado como ativo');
    console.log('   📊 Status retornado:', updateResult2.player.status);
    
    // 5. Verificar se a mudança foi persistida
    console.log('\n🔍 Verificando se a mudança foi persistida...');
    const verifyResponse2 = await fetch(`${API_BASE}/players`);
    const verifyData2 = await verifyResponse2.json();
    
    const updatedPlayer2 = verifyData2.data.players.find(p => p.name === testPlayer.name);
    console.log(`   Status no banco: ${updatedPlayer2.status}`);
    console.log(`   Propriedade active: ${updatedPlayer2.active}`);
    
    if (updatedPlayer2.active === true && updatedPlayer2.status === 'active') {
      console.log('   ✅ Status ativo persistido corretamente!');
    } else {
      console.log('   ❌ Status ativo NÃO foi persistido corretamente');
    }
    
    // 6. Resumo final
    console.log('\n📊 RESUMO DO TESTE:');
    console.log('='.repeat(50));
    
    const finalResponse = await fetch(`${API_BASE}/players`);
    const finalData = await finalResponse.json();
    const finalPlayers = finalData.data.players;
    
    finalPlayers.forEach(player => {
      const statusIcon = player.active ? '🟢' : '🔴';
      console.log(`${statusIcon} ${player.name}: ${player.active ? 'ATIVO' : 'INATIVO'} (status: ${player.status})`);
    });
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

// Executar teste
testPlayerStatus();