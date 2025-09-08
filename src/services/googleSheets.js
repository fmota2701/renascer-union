// Serviço para integração com Google Sheets API

class GoogleSheetsService {
  constructor() {
    this.apiKey = '';
    this.spreadsheetId = (typeof CONFIG !== 'undefined' && CONFIG.SPREADSHEET_ID) || '';
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Inicializar Google Sheets API
  async init() {
    try {
      // Verificar se as credenciais estão configuradas
      if (!this.apiKey || !this.spreadsheetId) {
        throw new Error('Credenciais do Google Sheets não configuradas');
      }

      // Testar conexão
      await this.testConnection();
      console.log('✅ Google Sheets API inicializada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Sheets API:', error);
      return false;
    }
  }

  // Testar conexão com a planilha
  async testConnection() {
    const url = `${this.baseUrl}/${this.spreadsheetId}?key=${this.apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na conexão: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Ler dados de uma aba específica
  async readSheet(sheetName, range = '') {
    try {
      const cacheKey = `${sheetName}_${range}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const fullRange = range ? `${sheetName}!${range}` : sheetName;
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${fullRange}?key=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao ler planilha: ${response.status}`);
      }
      
      const data = await response.json();
      const values = data.values || [];
      
      // Armazenar no cache
      this.setCache(cacheKey, values);
      
      return values;
    } catch (error) {
      console.error('Erro ao ler planilha:', error);
      throw error;
    }
  }

  // Escrever dados em uma aba específica
  async writeSheet(sheetName, range, values) {
    try {
      // Usar a função Netlify para escrita autenticada
      const response = await fetch(CONFIG.NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'write',
          sheetName: sheetName,
          range: range,
          values: values
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Salvar no localStorage como backup
      const key = `sheets_${sheetName}_${range}`;
      localStorage.setItem(key, JSON.stringify(values));
      
      // Invalidar cache
      this.clearCache();
      
      console.log('✅ Dados salvos no Google Sheets com sucesso!');
      return { success: true, message: 'Dados salvos no Google Sheets' };
    } catch (error) {
      console.error('Erro ao escrever na planilha:', error);
      
      // Fallback: salvar apenas localmente
      const key = `sheets_${sheetName}_${range}`;
      localStorage.setItem(key, JSON.stringify(values));
      
      console.warn('⚠️ Salvando apenas localmente devido ao erro');
      return { success: false, message: 'Dados salvos apenas localmente', error: error.message };
    }
  }

  // Ler dados dos jogadores
  async getPlayers() {
    try {
      const data = await this.readSheet('Jogadores');
      
      if (data.length === 0) {
        return [];
      }
      
      const headers = data[0];
      const players = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const player = {
          name: row[0] || '',
          active: row[1] !== 'false',
          counts: {},
          totalItemsReceived: 0
        };
        
        // Mapear itens (colunas 2 em diante)
        for (let j = 2; j < headers.length; j++) {
          const itemName = headers[j];
          const count = parseInt(row[j]) || 0;
          player.counts[itemName] = count;
          player.totalItemsReceived += count;
        }
        
        players.push(player);
      }
      
      return players;
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error);
      return [];
    }
  }

  // Ler lista de itens
  async getItems() {
    try {
      const data = await this.readSheet('Configuracao', 'A:A');
      return data.flat().filter(item => item && item.trim());
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return ['Cristal do Caos', 'Pena do Condor', 'Chama do Condor', 'Despertar', 'Arcanjo'];
    }
  }

  // Ler histórico
  async getHistory() {
    try {
      const data = await this.readSheet('Historico');
      
      if (data.length === 0) {
        return [];
      }
      
      const history = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        history.push({
          date: row[0] || '',
          player: row[1] || '',
          item: row[2] || '',
          quantity: parseInt(row[3]) || 1,
          action: row[4] || 'distribuir'
        });
      }
      
      return history.reverse(); // Mais recentes primeiro
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }

  // Salvar jogadores na planilha
  async savePlayers(players, items) {
    try {
      const headers = ['Nome', 'Ativo', ...items];
      const rows = [headers];
      
      players.forEach(player => {
        const row = [
          player.name,
          player.active ? 'true' : 'false'
        ];
        
        items.forEach(item => {
          row.push(player.counts[item] || 0);
        });
        
        rows.push(row);
      });
      
      return await this.writeSheet('Jogadores', 'A:Z', rows);
    } catch (error) {
      console.error('Erro ao salvar jogadores:', error);
      throw error;
    }
  }

  // Adicionar entrada no histórico
  async addHistoryEntry(entry) {
    try {
      const newRow = [
        new Date().toLocaleString('pt-BR'),
        entry.player,
        entry.item,
        entry.quantity,
        entry.action || 'distribuir'
      ];
      
      // Por enquanto, salvar no localStorage
      const existingHistory = JSON.parse(localStorage.getItem('sheets_history') || '[]');
      existingHistory.unshift(newRow);
      localStorage.setItem('sheets_history', JSON.stringify(existingHistory));
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar ao histórico:', error);
      throw error;
    }
  }

  // Gerenciamento de cache
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Método para salvar dados (compatibilidade com app.js)
  async saveData(state) {
    try {
      // Salvar localmente primeiro
      localStorage.setItem('guild_data', JSON.stringify(state));
      
      // Tentar sincronizar com Google Sheets se configurado
      if (this.spreadsheetId && this.apiKey) {
        await this.savePlayers(state.players || [], state.items || []);
        console.log('Dados sincronizados com Google Sheets');
      } else {
        console.log('Dados salvos localmente (Google Sheets não configurado)');
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      // Mesmo com erro, manter dados locais
      localStorage.setItem('guild_data', JSON.stringify(state));
    }
  }

  // Sincronizar dados locais com a planilha
  async syncWithSheets() {
    try {
      console.log('🔄 Sincronizando com Google Sheets...');
      
      // Buscar dados atualizados
      const players = await this.getPlayers();
      const items = await this.getItems();
      const history = await this.getHistory();
      
      // Mesclar com dados locais se houver
      const localData = this.getLocalData();
      
      return {
        players: this.mergePlayers(players, localData.players),
        items: items.length > 0 ? items : localData.items,
        history: this.mergeHistory(history, localData.history)
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return this.getLocalData();
    }
  }

  // Obter dados locais como fallback
  getLocalData() {
    try {
      return {
        players: JSON.parse(localStorage.getItem('guild_players') || '[]'),
        items: JSON.parse(localStorage.getItem('guild_items') || '["Cristal do Caos","Pena do Condor","Chama do Condor","Despertar","Arcanjo"]'),
        history: JSON.parse(localStorage.getItem('guild_history') || '[]')
      };
    } catch (error) {
      return {
        players: [],
        items: ['Cristal do Caos', 'Pena do Condor', 'Chama do Condor', 'Despertar', 'Arcanjo'],
        history: []
      };
    }
  }

  // Mesclar dados de jogadores
  mergePlayers(sheetPlayers, localPlayers) {
    if (!localPlayers || localPlayers.length === 0) {
      return sheetPlayers;
    }
    
    // Lógica simples: priorizar dados da planilha
    return sheetPlayers.length > 0 ? sheetPlayers : localPlayers;
  }

  // Mesclar histórico
  mergeHistory(sheetHistory, localHistory) {
    if (!localHistory || localHistory.length === 0) {
      return sheetHistory;
    }
    
    // Combinar e remover duplicatas
    const combined = [...sheetHistory, ...localHistory];
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex(h => 
        h.date === item.date && 
        h.player === item.player && 
        h.item === item.item
      )
    );
    
    return unique.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

// Instância singleton
const googleSheetsService = new GoogleSheetsService();

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  window.googleSheetsService = googleSheetsService;
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = googleSheetsService;
}