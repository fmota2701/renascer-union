// Cliente Socket.io para comunicação em tempo real
class RealtimeClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    // Detectar ambiente e configurar URL base
    if (window.location.hostname === 'localhost') {
      this.baseUrl = 'http://localhost:3001';
    } else if (window.location.hostname.includes('vercel.app')) {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = window.location.origin;
    }
    this.connectionRequired = true;
    this.init();
  }

  init() {
    // Carregar Socket.io dinamicamente
    if (typeof io === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script.onload = () => this.connect();
      document.head.appendChild(script);
    } else {
      this.connect();
    }
  }

  connect() {
    try {
      this.socket = io(this.baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Erro ao conectar com Socket.io:', error);
      this.handleConnectionError();
    }
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Conectado ao servidor em tempo real');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(true);
      
      // Solicitar dados iniciais
      this.socket.emit('request-initial-data');
      
      console.log('Conectado ao servidor!');
      if (typeof notifications !== 'undefined') {
        notifications.success('Conectado ao servidor online!');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Desconectado do servidor:', reason);
      this.isConnected = false;
      this.updateConnectionStatus(false);
      
      console.log('Desconectado do servidor');
      if (typeof notifications !== 'undefined') {
        notifications.warning('Conexão perdida. Tentando reconectar...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error);
      this.handleConnectionError();
    });

    // Eventos de dados
    this.socket.on('initial-data', (data) => {
      console.log('Dados iniciais recebidos:', data);
      this.handleInitialData(data);
    });

    this.socket.on('data-updated', (data) => {
      console.log('Dados atualizados recebidos:', data);
      this.handleDataUpdate(data);
    });

    this.socket.on('player-added', (player) => {
      console.log('Novo jogador adicionado:', player);
      this.handlePlayerAdded(player);
    });

    this.socket.on('player-updated', (player) => {
      console.log('Jogador atualizado:', player);
      this.handlePlayerUpdated(player);
    });

    this.socket.on('player-deleted', (data) => {
      console.log('Jogador removido:', data);
      this.handlePlayerDeleted(data);
    });

    this.socket.on('error', (error) => {
      console.error('Erro do servidor:', error);
      if (typeof notifications !== 'undefined') {
        notifications.error(error.message || 'Erro do servidor');
      }
    });
  }

  handleConnectionError() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else {
      console.error('Máximo de tentativas de reconexão atingido');
      if (typeof notifications !== 'undefined') {
        notifications.error('Não foi possível conectar ao servidor. Modo offline ativado.');
      }
    }
  }

  updateConnectionStatus(connected) {
    const statusElement = document.querySelector('.connection-status');
    if (statusElement) {
      statusElement.textContent = connected ? 'Online' : 'Offline';
      statusElement.className = `connection-status ${connected ? 'online' : 'offline'}`;
    }
  }

  // Métodos para lidar com atualizações de dados
  handleInitialData(data) {
    if (typeof window.loadStateFromData === 'function') {
      window.loadStateFromData(data);
    }
  }

  handleDataUpdate(data) {
    if (typeof window.loadStateFromData === 'function') {
      window.loadStateFromData(data);
      if (typeof notifications !== 'undefined') {
        notifications.info('Dados atualizados por outro usuário');
      }
    }
  }

  handlePlayerAdded(player) {
    if (typeof window.addPlayerFromServer === 'function') {
      window.addPlayerFromServer(player);
    } else {
      // Fallback: recarregar dados
      this.requestDataRefresh();
    }
  }

  handlePlayerUpdated(player) {
    if (typeof window.updatePlayerFromServer === 'function') {
      window.updatePlayerFromServer(player);
    } else {
      // Fallback: recarregar dados
      this.requestDataRefresh();
    }
  }

  handlePlayerDeleted(data) {
    if (typeof window.removePlayerFromServer === 'function') {
      window.removePlayerFromServer(data.id);
    } else {
      // Fallback: recarregar dados
      this.requestDataRefresh();
    }
  }

  requestDataRefresh() {
    if (this.isConnected) {
      this.socket.emit('request-initial-data');
    }
  }

  // Métodos para enviar dados para o servidor
  updateData(data) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Erro: Não conectado ao servidor. Operação cancelada.');
    }
    this.socket.emit('update-data', data);
  }

  saveData(data) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Erro: Não conectado ao servidor. Não é possível salvar dados.');
    }
    this.socket.emit('save-data', data);
  }

  // API REST fallback para quando WebSocket não está disponível
  async apiRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição API:', error);
      throw error;
    }
  }



  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

// Instância global do cliente
let realtimeClient = null;

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    realtimeClient = new RealtimeClient();
  });
} else {
  realtimeClient = new RealtimeClient();
}

// Exportar para uso global
window.realtimeClient = realtimeClient;