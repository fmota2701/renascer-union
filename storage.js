// Sistema de persistência usando localStorage
class LocalStorage {
  constructor() {
    this.storageKey = 'renascer-union-data';
    this.initializeData();
  }

  // Inicializar dados padrão se não existirem
  initializeData() {
    const existingData = this.getData();
    if (!existingData || Object.keys(existingData).length === 0) {
      const defaultData = {
        players: [
          {
            "id": "1",
            "name": "João Silva",
            "level": 85,
            "class": "Guerreiro",
            "guild": "Dragões de Ferro",
            "status": "online",
            "lastLogin": "2024-01-15T10:30:00Z"
          },
          {
            "id": "2",
            "name": "Maria Santos",
            "level": 92,
            "class": "Mago",
            "guild": "Círculo Arcano",
            "status": "offline",
            "lastLogin": "2024-01-14T22:15:00Z"
          },
          {
            "id": "3",
            "name": "Pedro Costa",
            "level": 78,
            "class": "Arqueiro",
            "guild": "Caçadores Sombrios",
            "status": "online",
            "lastLogin": "2024-01-15T09:45:00Z"
          }
        ],
        items: [
          {
            "id": "1",
            "name": "Espada Flamejante",
            "type": "Arma",
            "rarity": "Épico",
            "level": 80,
            "description": "Uma espada forjada nas chamas do dragão ancião"
          },
          {
            "id": "2",
            "name": "Armadura de Cristal",
            "type": "Armadura",
            "rarity": "Lendário",
            "level": 90,
            "description": "Armadura feita com cristais mágicos raros"
          },
          {
            "id": "3",
            "name": "Poção de Cura Maior",
            "type": "Consumível",
            "rarity": "Comum",
            "level": 1,
            "description": "Restaura 500 pontos de vida instantaneamente"
          }
        ],
        distribution: [
          {
            "id": "1",
            "playerId": "1",
            "playerName": "João Silva",
            "itemId": "1",
            "itemName": "Espada Flamejante",
            "date": "2024-01-15T10:30:00Z",
            "status": "entregue"
          }
        ]
      };
      this.saveData(defaultData);
    }
  }

  // Obter todos os dados
  getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao ler localStorage:', error);
      return {};
    }
  }

  // Salvar todos os dados
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  }

  // Obter dados de um recurso específico
  getResource(resource) {
    const data = this.getData();
    return data[resource] || [];
  }

  // Salvar dados de um recurso específico
  saveResource(resource, items) {
    const data = this.getData();
    data[resource] = items;
    return this.saveData(data);
  }

  // Adicionar item a um recurso
  addItem(resource, item) {
    const items = this.getResource(resource);
    const newItem = { ...item, id: this.generateId() };
    items.push(newItem);
    this.saveResource(resource, items);
    return newItem;
  }

  // Atualizar item de um recurso
  updateItem(resource, id, updates) {
    const items = this.getResource(resource);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.saveResource(resource, items);
      return items[index];
    }
    return null;
  }

  // Remover item de um recurso
  removeItem(resource, id) {
    const items = this.getResource(resource);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items.splice(index, 1);
      this.saveResource(resource, items);
      return true;
    }
    return false;
  }

  // Gerar ID único
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Limpar todos os dados
  clearAll() {
    localStorage.removeItem(this.storageKey);
    this.initializeData();
  }
}

// Instância global do sistema de storage
const storage = new LocalStorage();

// API wrapper que usa Firebase Firestore
class LocalAPI {
  constructor() {
    this.baseURL = '/api';
  }

  async request(method, endpoint, data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      // Fallback para localStorage se a API falhar
      return this.handleLocalRequest(method, endpoint, data);
    }
  }

  handleLocalRequest(method, endpoint, data) {
    const parts = endpoint.split('/').filter(part => part);
    const resource = parts[0];
    const id = parts[1];

    switch (method) {
      case 'GET':
        if (id) {
          const items = storage.getResource(resource);
          return items.find(item => item.id === id) || null;
        }
        return storage.getResource(resource);

      case 'POST':
        return storage.addItem(resource, data);

      case 'PUT':
        return storage.updateItem(resource, id, data);

      case 'DELETE':
        const success = storage.removeItem(resource, id);
        return success ? { message: 'Item removido com sucesso' } : { error: 'Item não encontrado' };

      default:
        throw new Error(`Método ${method} não suportado`);
    }
  }

  // Métodos de conveniência
  async getPlayers() {
    return this.request('GET', '/players');
  }

  async getPlayer(id) {
    return this.request('GET', `/players/${id}`);
  }

  async createPlayer(player) {
    return this.request('POST', '/players', player);
  }

  async updatePlayer(id, updates) {
    return this.request('PUT', `/players/${id}`, updates);
  }

  async deletePlayer(id) {
    return this.request('DELETE', `/players/${id}`);
  }

  async getItems() {
    return this.request('GET', '/items');
  }

  async getItem(id) {
    return this.request('GET', `/items/${id}`);
  }

  async createItem(item) {
    return this.request('POST', '/items', item);
  }

  async updateItem(id, updates) {
    return this.request('PUT', `/items/${id}`, updates);
  }

  async deleteItem(id) {
    return this.request('DELETE', `/items/${id}`);
  }

  async getDistributions() {
    return this.request('GET', '/distribution');
  }

  async createDistribution(distribution) {
    return this.request('POST', '/distribution', distribution);
  }

  async updateDistribution(id, updates) {
    return this.request('PUT', `/distribution/${id}`, updates);
  }

  async deleteDistribution(id) {
    return this.request('DELETE', `/distribution/${id}`);
  }
}

// Instância global da API
const api = new LocalAPI();

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.storage = storage;
  window.api = api;
}