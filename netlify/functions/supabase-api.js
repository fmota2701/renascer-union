/**
 * API Supabase para Sistema de Distribuição de Itens
 * Substitui o Google Sheets por Supabase para melhor performance
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Removido sistema de cache - dados sempre do Supabase
console.log('Sistema funcionando apenas com dados online do Supabase');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

/**
 * Função principal do handler
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, path, queryStringParameters, body } = event;
    const params = queryStringParameters || {};
    
    console.log(`${httpMethod} ${path}`, params);

    let result;
    
    switch (httpMethod) {
      case 'GET':
        result = await handleGet(path, params);
        break;
      case 'POST':
        result = await handlePost(path, JSON.parse(body || '{}'));
        break;
      case 'DELETE':
        result = await handleDelete(path, params);
        break;
      default:
        throw new Error(`Método ${httpMethod} não suportado`);
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Erro na API:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Handler para requisições GET
 */
async function handleGet(path, params) {
  const endpoint = path.replace('/.netlify/functions/supabase-api', '');
  
  switch (endpoint) {
    case '/players':
      return await getPlayersData(params);
    case '/items':
      return await getItemsData(params);
    case '/history':
      return await getHistoryData(params);
    case '/stats':
      return await getStatsData();
    case '/check-updates':
      return await handleCheckUpdates();
    default:
      throw new Error(`Endpoint GET ${endpoint} não encontrado`);
  }
}

/**
 * Handler para requisições POST
 */
async function handlePost(path, data) {
  const endpoint = path.replace('/.netlify/functions/supabase-api', '');
  
  switch (endpoint) {
    case '/distribute':
      return await handleDistribute(data);
    case '/sync':
      return await handleSync(data);
    case '/players':
      return await createPlayer(data);
    case '/items':
      return await createItem(data);
    default:
      throw new Error(`Endpoint POST ${endpoint} não encontrado`);
  }
}

async function handleDelete(path, params) {
  const endpoint = path.replace('/.netlify/functions/supabase-api', '');
  
  switch (endpoint) {
    case '/players':
      return await deletePlayer(params);
    case '/items':
      return await deleteItem(params);
    case '/history':
      return await deleteHistory(params);
    default:
      throw new Error(`Endpoint DELETE ${endpoint} não encontrado`);
  }
}

/**
 * Buscar dados dos jogadores
 */
async function getPlayersData(params = {}) {

  let query = supabase
    .from('players')
    .select('*');

  // Filtros
  if (params.name) {
    query = query.eq('name', params.name);
  }
  
  if (params.limit) {
    query = query.limit(parseInt(params.limit));
  }

  // Ordenação
  const orderBy = params.order_by || 'total_received';
  const orderDirection = params.order_direction || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Erro ao buscar jogadores: ${error.message}`);
  }

  // Buscar contadores de itens por jogador do histórico
  const { data: historyData, error: historyError } = await supabase
    .from('history')
    .select(`
      quantity,
      players!inner(name),
      items!inner(name)
    `);

  if (historyError) {
    console.warn('Erro ao buscar histórico para contadores:', historyError);
  }

  // Calcular contadores por jogador e item
  const playerCounts = {};
  if (historyData) {
    historyData.forEach(record => {
      const playerName = record.players.name;
      const itemName = record.items.name;
      const quantity = record.quantity || 1;
      
      if (!playerCounts[playerName]) {
        playerCounts[playerName] = {};
      }
      
      if (!playerCounts[playerName][itemName]) {
        playerCounts[playerName][itemName] = 0;
      }
      
      playerCounts[playerName][itemName] += quantity;
    });
  }

  // Transformar dados para o formato esperado pelo frontend
  const players = (data || []).map(player => ({
    name: player.name,
    counts: playerCounts[player.name] || {}, // Contadores calculados do histórico
    active: player.active !== false,
    faults: player.faults || 0,
    total_items: player.total_received || 0,
    total_distributions: player.total_distributions || 0
  }));

  const result = {
    players: players,
    total: players.length,
    timestamp: new Date().toISOString()
  };

  return result;
}

/**
 * Buscar dados dos itens
 */
async function getItemsData(params = {}) {

  let query = supabase
    .from('items')
    .select('*');

  // Filtros
  if (params.name) {
    query = query.eq('name', params.name);
  }
  
  if (params.limit) {
    query = query.limit(parseInt(params.limit));
  }

  // Ordenação
  const orderBy = params.order_by || 'name';
  const orderDirection = params.order_direction || 'asc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Erro ao buscar itens: ${error.message}`);
  }

  const result = {
    items: data || [],
    total: data?.length || 0,
    timestamp: new Date().toISOString()
  };

  return result;
}

/**
 * Buscar histórico de distribuições
 */
async function getHistoryData(params = {}) {

  let query = supabase
    .from('history')
    .select(`
      *,
      players!inner(name),
      items!inner(name)
    `)
    .order('created_at', { ascending: false });

  // Filtros
  if (params.player_name) {
    query = query.ilike('players.name', `%${params.player_name}%`);
  }
  
  if (params.item_name) {
    query = query.ilike('items.name', `%${params.item_name}%`);
  }
  
  if (params.date_from) {
    query = query.gte('created_at', params.date_from);
  }
  
  if (params.date_to) {
    query = query.lte('created_at', params.date_to);
  }
  
  const limit = parseInt(params.limit) || 100;
  query = query.limit(limit);

  console.log('Executando query do histórico...');
  const { data, error } = await query;
  
  console.log('Resultado da query:', { data, error });
  
  if (error) {
    console.error('Erro na query do histórico:', error);
    throw new Error(`Erro ao buscar histórico: ${error.message}`);
  }

  // Transformar dados para o formato esperado pelo frontend
  const history = (data || []).map(record => ({
    id: record.id,
    player: record.players.name,
    item: record.items.name,
    quantity: record.quantity,
    date: record.created_at,
    type: record.distribution_type || 'automatic',
    notes: record.notes || '',
    batchId: record.batch_id || 0
  }));

  const result = {
    history: history,
    total: history.length,
    timestamp: new Date().toISOString()
  };

  return result;
}

/**
 * Buscar estatísticas gerais
 */
async function getStatsData() {

  // Buscar estatísticas em paralelo
  const [playersResult, itemsResult, historyResult, configResult] = await Promise.all([
    supabase.from('players').select('id, total_items, status'),
    supabase.from('items').select('id, total_distributed, available_quantity'),
    supabase.from('history').select('id, distribution_date').gte('distribution_date', new Date(Date.now() - 24*60*60*1000).toISOString()),
    supabase.from('system_config').select('*')
  ]);

  if (playersResult.error || itemsResult.error || historyResult.error || configResult.error) {
    throw new Error('Erro ao buscar estatísticas');
  }

  const players = playersResult.data || [];
  const items = itemsResult.data || [];
  const recentHistory = historyResult.data || [];
  const config = configResult.data || [];

  const result = {
    players: {
      total: players.length,
      active: players.filter(p => p.status === 'active').length,
      total_items_distributed: players.reduce((sum, p) => sum + (p.total_items || 0), 0)
    },
    items: {
      total: items.length,
      total_distributed: items.reduce((sum, i) => sum + (i.total_distributed || 0), 0),
      total_available: items.reduce((sum, i) => sum + (i.available_quantity || 0), 0)
    },
    distributions: {
      last_24h: recentHistory.length,
      last_sync: config.find(c => c.key === 'last_sync_date')?.value
    },
    system: {
      status: config.find(c => c.key === 'system_status')?.value || 'active',
      max_items_per_distribution: parseInt(config.find(c => c.key === 'max_items_per_distribution')?.value || '30'),
      distributions_per_day: parseInt(config.find(c => c.key === 'distributions_per_day')?.value || '2')
    },
    timestamp: new Date().toISOString()
  };

  return result;
}

/**
 * Distribuir itens para jogadores
 */
async function handleDistribute(data) {
  const { distributions, selectedPlayers } = data;
  
  if (!distributions || !Array.isArray(distributions)) {
    throw new Error('Dados de distribuição inválidos');
  }

  const results = [];
  const errors = [];
  
  console.log('DEBUG - Dados recebidos:', { distributions, selectedPlayers });

  // Processar distribuições em transação
  for (const dist of distributions) {
    try {
      const { player_name, item_name, quantity = 1, notes = '' } = dist;
      
      console.log('Processando distribuição:', { player_name, item_name, quantity, notes });
      
      // Buscar IDs do jogador e item
      const [playerResult, itemResult] = await Promise.all([
        supabase.from('players').select('id').eq('name', player_name).single(),
        supabase.from('items').select('id').eq('name', item_name).single()
      ]);
      
      console.log('Resultados da busca:', { playerResult, itemResult });

      if (playerResult.error) {
        throw new Error(`Jogador '${player_name}' não encontrado`);
      }
      
      if (itemResult.error) {
        throw new Error(`Item '${item_name}' não encontrado`);
      }

      const player = playerResult.data;
      const item = itemResult.data;

      // Pular verificação de disponibilidade para este sistema

      // Inserir no histórico (triggers atualizarão automaticamente os totais)
      console.log('Tentando inserir no histórico:', {
        player_id: player.id,
        item_id: item.id,
        quantity: quantity,
        notes: notes || `Distribuição de ${item_name} para ${player_name}`
      });
      
      const { data: historyData, error: historyError } = await supabase
        .from('history')
        .insert({
          player_id: player.id,
          item_id: item.id,
          quantity: quantity,
          notes: notes || `Distribuição de ${item_name} para ${player_name}`
        })
        .select();

      console.log('Resultado da inserção no histórico:', { historyData, historyError });

      if (historyError) {
        throw new Error(`Erro ao registrar distribuição: ${historyError.message}`);
      }

      // Não atualizar quantidade disponível para este sistema

      results.push({
        player: player_name,
        item: item_name,
        quantity: quantity,
        status: 'success'
      });

    } catch (error) {
      errors.push({
        distribution: dist,
        error: error.message
      });
    }
  }

  // Aplicar faltas automáticas aos jogadores não selecionados
  if (selectedPlayers && Array.isArray(selectedPlayers)) {
    try {
      console.log('DEBUG - Aplicando faltas automáticas...');
      
      // Buscar todos os jogadores ativos
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, name, faults')
        .eq('status', 'active');
      
      if (playersError) {
        console.error('Erro ao buscar jogadores:', playersError);
      } else {
        console.log('DEBUG - Jogadores ativos:', allPlayers.map(p => ({ name: p.name, faults: p.faults })));
        console.log('DEBUG - Jogadores selecionados:', selectedPlayers);
        
        // Encontrar jogadores não selecionados
        const nonSelectedPlayers = allPlayers.filter(player => 
          !selectedPlayers.includes(player.name)
        );
        
        console.log('DEBUG - Jogadores não selecionados:', nonSelectedPlayers.map(p => p.name));
        
        // Adicionar falta a cada jogador não selecionado
        for (const player of nonSelectedPlayers) {
          const newFaults = (player.faults || 0) + 1;
          
          const { error: faultError } = await supabase
            .from('players')
            .update({ faults: newFaults })
            .eq('id', player.id);
          
          if (faultError) {
            console.error(`Erro ao adicionar falta para ${player.name}:`, faultError);
          } else {
            console.log(`DEBUG - ${player.name}: faltas ${player.faults || 0} -> ${newFaults}`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar faltas automáticas:', error);
    }
  }

  // Cache removido - dados sempre atualizados

  return {
    success: results.length,
    errors: errors.length,
    results: results,
    error_details: errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Criar novo jogador
 */
async function createPlayer(data) {
  const { name } = data;
  
  if (!name) {
    throw new Error('Nome do jogador é obrigatório');
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({ name })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar jogador: ${error.message}`);
  }

  // Cache removido - dados sempre atualizados
  
  return {
    player: player,
    message: 'Jogador criado com sucesso',
    timestamp: new Date().toISOString()
  };
}

/**
 * Criar novo item
 */
async function createItem(data) {
  const { 
    name, 
    category = 'Geral', 
    rarity = 'Comum', 
    value = 0, 
    description = '', 
    available_quantity = 0 
  } = data;
  
  if (!name) {
    throw new Error('Nome do item é obrigatório');
  }

  const { data: item, error } = await supabase
    .from('items')
    .insert({ 
      name, 
      category, 
      rarity, 
      value, 
      description, 
      available_quantity 
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar item: ${error.message}`);
  }

  // Cache removido - dados sempre atualizados
  
  return {
    item: item,
    message: 'Item criado com sucesso',
    timestamp: new Date().toISOString()
  };
}

/**
 * Sincronização (limpar cache e atualizar configurações)
 */
async function handleSync(data = {}) {
  console.log('handleSync chamado com dados:', data);
  
  // Limpar todo o cache
  // Cache removido - dados sempre atualizados
  
  let syncResults = {
    players_synced: 0,
    items_synced: 0,
    history_synced: 0,
    errors: []
  };
  
  // Se há estado para sincronizar
  if (data.state) {
    const { state } = data;
    
    // Sincronizar jogadores
      if (state.players && Array.isArray(state.players)) {
        for (const player of state.players) {
          try {
            const { error } = await supabase
              .from('players')
              .upsert({
                name: player.name,
                active: player.active !== false,
                faults: player.faults || 0
              }, { onConflict: 'name' });
            
            if (error) {
              syncResults.errors.push(`Erro ao sincronizar jogador ${player.name}: ${error.message}`);
            } else {
              syncResults.players_synced++;
            }
          } catch (err) {
            syncResults.errors.push(`Erro ao processar jogador ${player.name}: ${err.message}`);
          }
        }
      }
    
    // Sincronizar itens
    if (state.items && Array.isArray(state.items)) {
      for (const item of state.items) {
        try {
          const { error } = await supabase
            .from('items')
            .upsert({
              name: item.name || item,
              updated_at: new Date().toISOString()
            }, { onConflict: 'name' });
          
          if (error) {
            syncResults.errors.push(`Erro ao sincronizar item ${item.name || item}: ${error.message}`);
          } else {
            syncResults.items_synced++;
          }
        } catch (err) {
          syncResults.errors.push(`Erro ao processar item ${item.name || item}: ${err.message}`);
        }
      }
    }
    
    // Sincronizar histórico
    if (state.history && Array.isArray(state.history)) {
      for (const entry of state.history) {
        try {
          // Criar uma chave única baseada nos dados da entrada
          const uniqueKey = `${entry.player}_${entry.item}_${entry.date}_${entry.qty || 1}`;
          
          const { error } = await supabase
            .from('history')
            .upsert({
              unique_key: uniqueKey,
              player_name: entry.player,
              item_name: entry.item,
              quantity: entry.qty || 1,
              date: entry.date || new Date().toISOString(),
              created_at: new Date().toISOString()
            }, { onConflict: 'unique_key' });
          
          if (error) {
            syncResults.errors.push(`Erro ao sincronizar histórico: ${error.message}`);
          } else {
            syncResults.history_synced++;
          }
        } catch (err) {
          syncResults.errors.push(`Erro ao processar entrada do histórico: ${err.message}`);
        }
      }
    }
  }
  
  // Atualizar data de sincronização
  const { error } = await supabase
    .from('system_config')
    .upsert({ 
      key: 'last_sync_date',
      value: new Date().toISOString() 
    }, { onConflict: 'key' });

  if (error) {
    console.error('Erro ao atualizar data de sync:', error);
    syncResults.errors.push(`Erro ao atualizar data de sync: ${error.message}`);
  }

  return {
    message: 'Sincronização realizada com sucesso',
    cache_cleared: true,
    timestamp: new Date().toISOString(),
    sync_results: syncResults
  };
}

/**
 * Verificar atualizações (compatibilidade com sistema anterior)
 */
async function handleCheckUpdates() {
  try {
    // Buscar dados atualizados
    const [playersData, itemsData, historyData] = await Promise.all([
      getPlayersData(),
      getItemsData(),
      getHistoryData({ limit: 50 })
    ]);

    // Construir o estado no formato esperado pelo frontend
    const state = {
      players: playersData.players || [],
      items: (itemsData.items || []).map(item => item.name), // Extrair apenas os nomes dos itens
      history: (historyData.history || []).map(h => ({
        player: h.player,
        item: h.item,
        qty: h.quantity || 1,
        date: h.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        timestamp: h.date
      })),
      rotation: {},
      ui: { editUnlocked: false },
      lastBatchId: 0
    };

    // Garantir que cada jogador tenha a estrutura correta
    state.players.forEach(player => {
      if (!player.counts) player.counts = {};
      if (typeof player.active === 'undefined') player.active = true;
      if (typeof player.faults === 'undefined') player.faults = 0;
      
      // Garantir que o jogador tenha contadores para todos os itens
      state.items.forEach(item => {
        if (typeof player.counts[item] === 'undefined') {
          player.counts[item] = 0;
        }
      });
    });

    // Calcular timestamp da última atualização baseado nos dados mais recentes
    let lastUpdated = new Date(0).toISOString(); // Data mínima como fallback
    
    // Verificar timestamp mais recente do histórico
    if (state.history && state.history.length > 0) {
      const latestHistory = state.history.reduce((latest, current) => {
        const currentTime = new Date(current.timestamp || 0);
        const latestTime = new Date(latest.timestamp || 0);
        return currentTime > latestTime ? current : latest;
      });
      
      if (latestHistory.timestamp) {
        lastUpdated = latestHistory.timestamp;
      }
    }

    return {
      state: state,
      has_updates: true,
      last_updated: lastUpdated,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro em handleCheckUpdates:', error);
    return {
      state: null,
      has_updates: false,
      last_updated: null,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

async function deletePlayer(params) {
  console.log('deletePlayer chamado com params:', params);
  
  const { name } = params;
  if (!name) {
    throw new Error('Nome do jogador é obrigatório');
  }
  
  // Cache removido - dados sempre atualizados
  
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('name', name);
    
    if (error) {
      throw new Error(`Erro ao deletar jogador: ${error.message}`);
    }
    
    return {
      message: `Jogador "${name}" deletado com sucesso`,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Erro ao deletar jogador:', err);
    throw err;
  }
}

async function deleteItem(params) {
  console.log('deleteItem chamado com params:', params);
  
  const { name } = params;
  if (!name) {
    throw new Error('Nome do item é obrigatório');
  }
  
  // Cache removido - dados sempre atualizados
  
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('name', name);
    
    if (error) {
      throw new Error(`Erro ao deletar item: ${error.message}`);
    }
    
    return {
      message: `Item "${name}" deletado com sucesso`,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Erro ao deletar item:', err);
    throw err;
  }
}

/**
 * Deletar entrada do histórico
 */
async function deleteHistory(params) {
  const { id } = params;
  
  if (!id) {
    throw new Error('ID da entrada do histórico é obrigatório');
  }

  console.log('Deletando entrada do histórico:', id);
  
  const { data, error } = await supabase
    .from('history')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    console.error('Erro ao deletar entrada do histórico:', error);
    throw new Error(`Erro ao deletar entrada do histórico: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Entrada do histórico não encontrada');
  }

  return {
    message: 'Entrada do histórico excluída com sucesso',
    deleted_entry: data[0],
    timestamp: new Date().toISOString()
  };
}

/**
 * Cache removido - sistema funciona apenas online
 */