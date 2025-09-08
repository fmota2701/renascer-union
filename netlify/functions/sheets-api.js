// Função serverless do Netlify para integração com Google Sheets

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Configuração de CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Função principal
exports.handler = async (event, context) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Verificar variáveis de ambiente
    const {
      GOOGLE_SPREADSHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_KEY
    } = process.env;

    if (!GOOGLE_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configurações do Google Sheets não encontradas'
        })
      };
    }

    // Parse das credenciais do service account
    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Formato inválido das credenciais do Google Service Account'
        })
      };
    }

    // Configurar autenticação
    const serviceAccountAuth = new JWT({
      email: serviceAccountCredentials.client_email,
      key: serviceAccountCredentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Conectar à planilha
    const doc = new GoogleSpreadsheet(GOOGLE_SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const { httpMethod, path, body } = event;
    const pathParts = path.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 1];

    switch (httpMethod) {
      case 'GET':
        if (action === 'check-updates') {
          return await handleCheckUpdates(doc);
        } else {
          return await handleGet(doc, action);
        }
      
      case 'POST':
        if (action === 'sync') {
          return await handleSync(doc, JSON.parse(body || '{}'));
        } else {
          return await handlePost(doc, action, JSON.parse(body || '{}'));
        }
      
      case 'PUT':
        return await handlePut(doc, action, JSON.parse(body || '{}'));
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

  } catch (error) {
    console.error('Erro na função sheets-api:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message
      })
    };
  }
};

// Manipular requisições GET
async function handleGet(doc, action) {
  try {
    switch (action) {
      case 'players':
        return await getPlayers(doc);
      
      case 'items':
        return await getItems(doc);
      
      case 'history':
        return await getHistory(doc);
      
      case 'all':
        const [players, items, history] = await Promise.all([
          getPlayersData(doc),
          getItemsData(doc),
          getHistoryData(doc)
        ]);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            players,
            items,
            history,
            lastSync: new Date().toISOString()
          })
        };
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint não encontrado' })
        };
    }
  } catch (error) {
    throw error;
  }
}

// Manipular requisições POST
async function handlePost(doc, action, data) {
  try {
    switch (action) {
      case 'players':
        return await addPlayer(doc, data);
      
      case 'history':
        return await addHistoryEntry(doc, data);
      
      case 'distribute':
        return await distributeItem(doc, data);
      
      case 'write':
        return await writeToSheet(doc, data);
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint não encontrado' })
        };
    }
  } catch (error) {
    throw error;
  }
}

// Manipular requisições PUT
async function handlePut(doc, action, data) {
  try {
    switch (action) {
      case 'players':
        return await updatePlayers(doc, data);
      
      case 'items':
        return await updateItems(doc, data);
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint não encontrado' })
        };
    }
  } catch (error) {
    throw error;
  }
}

// Obter dados dos jogadores
async function getPlayers(doc) {
  const data = await getPlayersData(doc);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data)
  };
}

async function getPlayersData(doc) {
  try {
    const sheet = doc.sheetsByTitle['Jogadores'] || await doc.addSheet({ title: 'Jogadores' });
    const rows = await sheet.getRows();
    
    const players = rows.map(row => {
      const player = {
        name: row.get('Nome') || '',
        active: row.get('Ativo') !== 'false',
        counts: {},
        totalItemsReceived: 0
      };
      
      // Mapear itens (todas as colunas exceto Nome e Ativo)
      const headers = sheet.headerValues;
      for (let i = 2; i < headers.length; i++) {
        const itemName = headers[i];
        const count = parseInt(row.get(itemName)) || 0;
        player.counts[itemName] = count;
        player.totalItemsReceived += count;
      }
      
      return player;
    });
    
    return players;
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    return [];
  }
}

// Obter lista de itens
async function getItems(doc) {
  const data = await getItemsData(doc);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data)
  };
}

async function getItemsData(doc) {
  try {
    const sheet = doc.sheetsByTitle['Configuracao'] || await doc.addSheet({ title: 'Configuracao' });
    const rows = await sheet.getRows();
    
    const items = rows.map(row => row.get('Item')).filter(item => item && item.trim());
    
    // Se não houver itens, retornar lista padrão
    if (items.length === 0) {
      return ['Cristal do Caos', 'Pena do Condor', 'Chama do Condor', 'Despertar', 'Arcanjo'];
    }
    
    return items;
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    return ['Cristal do Caos', 'Pena do Condor', 'Chama do Condor', 'Despertar', 'Arcanjo'];
  }
}

// Obter histórico
async function getHistory(doc) {
  const data = await getHistoryData(doc);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data)
  };
}

async function getHistoryData(doc) {
  try {
    const sheet = doc.sheetsByTitle['Historico'] || await doc.addSheet({ title: 'Historico' });
    const rows = await sheet.getRows();
    
    const history = rows.map(row => ({
      date: row.get('Data') || '',
      player: row.get('Jogador') || '',
      item: row.get('Item') || '',
      quantity: parseInt(row.get('Quantidade')) || 1,
      action: row.get('Acao') || 'distribuir'
    }));
    
    return history.reverse(); // Mais recentes primeiro
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}

// Adicionar jogador
async function addPlayer(doc, playerData) {
  try {
    const sheet = doc.sheetsByTitle['Jogadores'] || await doc.addSheet({ title: 'Jogadores' });
    
    // Verificar se o jogador já existe
    const rows = await sheet.getRows();
    const existingPlayer = rows.find(row => row.get('Nome') === playerData.name);
    
    if (existingPlayer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Jogador já existe' })
      };
    }
    
    // Adicionar novo jogador
    const newRow = {
      'Nome': playerData.name,
      'Ativo': 'true'
    };
    
    // Adicionar colunas de itens se existirem
    if (playerData.items) {
      playerData.items.forEach(item => {
        newRow[item] = 0;
      });
    }
    
    await sheet.addRow(newRow);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, message: 'Jogador adicionado com sucesso' })
    };
  } catch (error) {
    throw error;
  }
}

// Atualizar jogadores
async function updatePlayers(doc, playersData) {
  try {
    const sheet = doc.sheetsByTitle['Jogadores'] || await doc.addSheet({ title: 'Jogadores' });
    
    // Limpar planilha
    await sheet.clear();
    
    // Definir cabeçalhos
    const items = playersData.items || [];
    const headers = ['Nome', 'Ativo', ...items];
    await sheet.setHeaderRow(headers);
    
    // Adicionar jogadores
    const rows = playersData.players.map(player => {
      const row = {
        'Nome': player.name,
        'Ativo': player.active ? 'true' : 'false'
      };
      
      items.forEach(item => {
        row[item] = player.counts[item] || 0;
      });
      
      return row;
    });
    
    if (rows.length > 0) {
      await sheet.addRows(rows);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Jogadores atualizados com sucesso' })
    };
  } catch (error) {
    throw error;
  }
}

// Adicionar entrada no histórico
async function addHistoryEntry(doc, entryData) {
  try {
    const sheet = doc.sheetsByTitle['Historico'] || await doc.addSheet({ 
      title: 'Historico',
      headerValues: ['Data', 'Jogador', 'Item', 'Quantidade', 'Acao']
    });
    
    await sheet.addRow({
      'Data': new Date().toLocaleString('pt-BR'),
      'Jogador': entryData.player,
      'Item': entryData.item,
      'Quantidade': entryData.quantity || 1,
      'Acao': entryData.action || 'distribuir'
    });
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, message: 'Entrada adicionada ao histórico' })
    };
  } catch (error) {
    throw error;
  }
}

// Distribuir item
async function distributeItem(doc, distributionData) {
  try {
    // Atualizar jogadores
    await updatePlayers(doc, distributionData);
    
    // Adicionar ao histórico
    await addHistoryEntry(doc, {
      player: distributionData.player,
      item: distributionData.item,
      quantity: distributionData.quantity,
      action: 'distribuir'
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Item distribuído com sucesso' })
    };
  } catch (error) {
    throw error;
  }
}

// Escrever dados genéricos em uma aba da planilha
async function writeToSheet(doc, data) {
  try {
    // Obter ou criar aba "Estado"
    let stateSheet;
    try {
      stateSheet = doc.sheetsByTitle['Estado'];
    } catch (error) {
      stateSheet = await doc.addSheet({ title: 'Estado' });
    }

    // Limpar conteúdo existente
    await stateSheet.clear();

    // Preparar dados para escrita
    const rows = [];
    
    // Cabeçalho
    rows.push(['Tipo', 'Dados', 'Timestamp']);
    
    // Dados do estado
    rows.push([
      'Estado Completo',
      JSON.stringify(data),
      new Date().toISOString()
    ]);

    // Escrever dados
    await stateSheet.addRows(rows);

    return {
      success: true,
      message: 'Estado salvo com sucesso',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erro ao escrever no Google Sheets:', error);
    throw new Error(`Erro ao salvar estado: ${error.message}`);
  }
}

// Função para sincronização em tempo real
async function handleSync(doc, data) {
  try {
    const { state, timestamp } = data;
    
    // Salvar estado completo
    const result = await writeToSheet(doc, {
      ...state,
      lastSync: timestamp
    });
    
    return {
      success: true,
      message: 'Sincronização realizada com sucesso',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Erro na sincronização:', error);
    throw new Error(`Erro na sincronização: ${error.message}`);
  }
}

// Função para verificar atualizações
async function handleCheckUpdates(doc) {
  try {
    // Obter aba "Estado"
    let stateSheet;
    try {
      stateSheet = doc.sheetsByTitle['Estado'];
    } catch (error) {
      return {
        hasUpdates: false,
        message: 'Nenhum estado encontrado'
      };
    }

    // Carregar dados da planilha
    const rows = await stateSheet.getRows();
    
    if (rows.length === 0) {
      return {
        hasUpdates: false,
        message: 'Nenhum dado encontrado'
      };
    }

    // Obter último estado salvo
    const lastRow = rows[rows.length - 1];
    const stateData = JSON.parse(lastRow.get('Dados') || '{}');
    const lastUpdate = lastRow.get('Timestamp');
    
    // Verificar se há atualizações (sempre retorna true para forçar sincronização)
    return {
      hasUpdates: true,
      state: stateData,
      lastUpdate: lastUpdate,
      message: 'Dados atualizados disponíveis'
    };
    
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
    return {
      hasUpdates: false,
      error: error.message
    };
  }
}