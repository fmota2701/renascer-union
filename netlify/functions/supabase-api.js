/**
 * API Supabase para Sistema de Distribuição de Itens
 * Substitui o Google Sheets por Supabase para melhor performance
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache em memória para otimização
const cache = new Map();
const CACHE_TTL = 30000; // 30 segundos

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

/**
 * Buscar dados dos jogadores
 */
async function getPlayersData(params = {}) {
  const cacheKey = `players_${JSON.stringify(params)}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit: players');
      return cached.data;
    }
  }

  let query = supabase
    .from('player_stats')
    .select('*');

  // Filtros
  if (params.status) {
    query = query.eq('status', params.status);
  }
  
  if (params.limit) {
    query = query.limit(parseInt(params.limit));
  }

  // Ordenação
  const orderBy = params.order_by || 'total_items';
  const orderDirection = params.order_direction || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Erro ao buscar jogadores: ${error.message}`);
  }

  const result = {
    players: data || [],
    total: data?.length || 0,
    timestamp: new Date().toISOString()
  };

  // Cache result
  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * Buscar dados dos itens
 */
async function getItemsData(params = {}) {
  const cacheKey = `items_${JSON.stringify(params)}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit: items');
      return cached.data;
    }
  }

  let query = supabase
    .from('item_stats')
    .select('*');

  // Filtros
  if (params.category) {
    query = query.eq('category', params.category);
  }
  
  if (params.rarity) {
    query = query.eq('rarity', params.rarity);
  }
  
  if (params.available_only === 'true') {
    query = query.gt('available_quantity', 0);
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
    categories: [...new Set(data?.map(item => item.category) || [])],
    rarities: [...new Set(data?.map(item => item.rarity) || [])],
    timestamp: new Date().toISOString()
  };

  // Cache result
  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * Buscar histórico de distribuições
 */
async function getHistoryData(params = {}) {
  const cacheKey = `history_${JSON.stringify(params)}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit: history');
      return cached.data;
    }
  }

  let query = supabase
    .from('recent_distributions')
    .select('*');

  // Filtros
  if (params.player_name) {
    query = query.ilike('player_name', `%${params.player_name}%`);
  }
  
  if (params.item_name) {
    query = query.ilike('item_name', `%${params.item_name}%`);
  }
  
  if (params.date_from) {
    query = query.gte('distribution_date', params.date_from);
  }
  
  if (params.date_to) {
    query = query.lte('distribution_date', params.date_to);
  }
  
  const limit = parseInt(params.limit) || 100;
  query = query.limit(limit);

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Erro ao buscar histórico: ${error.message}`);
  }

  const result = {
    history: data || [],
    total: data?.length || 0,
    timestamp: new Date().toISOString()
  };

  // Cache result
  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * Buscar estatísticas gerais
 */
async function getStatsData() {
  const cacheKey = 'stats';
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit: stats');
      return cached.data;
    }
  }

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

  // Cache result
  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * Distribuir itens para jogadores
 */
async function handleDistribute(data) {
  const { distributions } = data;
  
  if (!distributions || !Array.isArray(distributions)) {
    throw new Error('Dados de distribuição inválidos');
  }

  const results = [];
  const errors = [];

  // Processar distribuições em transação
  for (const dist of distributions) {
    try {
      const { player_name, item_name, quantity = 1, notes = '' } = dist;
      
      // Buscar IDs do jogador e item
      const [playerResult, itemResult] = await Promise.all([
        supabase.from('players').select('id').eq('name', player_name).single(),
        supabase.from('items').select('id, available_quantity').eq('name', item_name).single()
      ]);

      if (playerResult.error) {
        throw new Error(`Jogador '${player_name}' não encontrado`);
      }
      
      if (itemResult.error) {
        throw new Error(`Item '${item_name}' não encontrado`);
      }

      const player = playerResult.data;
      const item = itemResult.data;

      // Verificar disponibilidade
      if (item.available_quantity < quantity) {
        throw new Error(`Item '${item_name}' sem quantidade suficiente (disponível: ${item.available_quantity})`);
      }

      // Inserir no histórico (triggers atualizarão automaticamente os totais)
      const { error: historyError } = await supabase
        .from('history')
        .insert({
          player_id: player.id,
          item_id: item.id,
          quantity: quantity,
          distribution_type: 'manual',
          notes: notes
        });

      if (historyError) {
        throw new Error(`Erro ao registrar distribuição: ${historyError.message}`);
      }

      // Atualizar quantidade disponível do item
      const { error: updateError } = await supabase
        .from('items')
        .update({ available_quantity: item.available_quantity - quantity })
        .eq('id', item.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar item: ${updateError.message}`);
      }

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

  // Limpar cache
  clearCache();

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
  const { name, status = 'active' } = data;
  
  if (!name) {
    throw new Error('Nome do jogador é obrigatório');
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({ name, status })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar jogador: ${error.message}`);
  }

  clearCache();
  
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

  clearCache();
  
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
  clearCache();
  
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
                name: player.name
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
          const { error } = await supabase
            .from('history')
            .insert({
              player_name: entry.player,
              item_name: entry.item,
              date: entry.date || new Date().toISOString(),
              created_at: new Date().toISOString()
            });
          
          if (error && !error.message.includes('duplicate')) {
            syncResults.errors.push(`Erro ao sincronizar histórico: ${error.message}`);
          } else if (!error) {
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
  // Buscar dados atualizados
  const [playersData, itemsData, historyData] = await Promise.all([
    getPlayersData(),
    getItemsData(),
    getHistoryData({ limit: 50 })
  ]);

  // Construir o estado no formato esperado pelo frontend
  const state = {
    players: playersData.players || [],
    items: itemsData.items || [],
    history: historyData.history || [],
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

  return {
    state: state,
    has_updates: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Limpar cache
 */
function clearCache() {
  cache.clear();
  console.log('Cache limpo');
}

// Limpar cache periodicamente
setInterval(clearCache, 5 * 60 * 1000); // 5 minutos