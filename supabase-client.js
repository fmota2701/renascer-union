/**
 * Cliente Supabase para o frontend
 * Configuração para realtime subscriptions
 */

// Configuração do Supabase (usando arquivo de config)
function getSupabaseConfig() {
  if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE) {
    return CONFIG.SUPABASE;
  }
  // Fallback para configurações padrão
  return {
    URL: 'https://ofdlacirerempfjohgsj.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGxhY2lyZXJlbXBmam9oZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNjg1NzUsImV4cCI6MjA3Mjk0NDU3NX0.1VOaD9QeDepJEZTiYtKrPTdfkBDcn2__jRnCfV-BZtU'
  };
}

// Importar Supabase (assumindo que está disponível globalmente ou via CDN)
let supabaseClient = null;

// Aguardar carregamento do Supabase
function waitForSupabase(callback, maxAttempts = 200) {
  let attempts = 0;
  
  function check() {
    attempts++;
    
    // Verificar se o Supabase está disponível globalmente
    const supabaseAvailable = (
      (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') ||
      (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function')
    );
    
    if (supabaseAvailable) {
      console.log('✅ Supabase detectado e createClient disponível, inicializando...');
      callback();
    } else if (attempts < maxAttempts) {
      if (attempts % 20 === 0) {
        console.log(`🔄 Aguardando Supabase... tentativa ${attempts}/${maxAttempts}`);
        console.log('Debug: window.supabase =', typeof window !== 'undefined' ? typeof window.supabase : 'window undefined');
        console.log('Debug: global supabase =', typeof supabase);
      }
      setTimeout(check, 25); // Verificar a cada 25ms
    } else {
      console.error('❌ Timeout: Supabase não foi carregado após', maxAttempts * 25, 'ms');
      console.log('Debug final: window.supabase =', typeof window !== 'undefined' ? typeof window.supabase : 'window undefined');
      console.log('Debug final: global supabase =', typeof supabase);
      console.log('Debug final: window keys =', typeof window !== 'undefined' ? Object.keys(window).filter(k => k.toLowerCase().includes('supabase')) : 'window undefined');
    }
  }
  
  check();
}

// Inicializar cliente Supabase
function initSupabaseClient() {
  try {
    // Verificar se o Supabase está disponível
    const supabaseLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (!supabaseLib) {
      console.error('Supabase não está disponível. Certifique-se de incluir o script do Supabase.');
      return null;
    }
    
    const config = getSupabaseConfig();
    supabaseClient = supabaseLib.createClient(config.URL, config.ANON_KEY);
    console.log('✅ Cliente Supabase inicializado');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Erro ao inicializar cliente Supabase:', error);
    return null;
  }
}

// Obter cliente Supabase
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = initSupabaseClient();
  }
  return supabaseClient;
}

// Configurar subscriptions para realtime
class SupabaseRealtimeManager {
  constructor() {
    this.subscriptions = new Map();
    this.client = getSupabaseClient();
  }
  
  // Subscrever mudanças na tabela de jogadores
  subscribeToPlayers(callback) {
    if (!this.client) {
      console.error('Cliente Supabase não disponível');
      return null;
    }
    
    const subscription = this.client
      .channel('players-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players'
      }, (payload) => {
        console.log('🔄 Mudança na tabela players:', payload);
        callback(payload);
      })
      .subscribe();
    
    this.subscriptions.set('players', subscription);
    console.log('📡 Subscrito a mudanças na tabela players');
    return subscription;
  }
  
  // Subscrever mudanças na tabela de itens
  subscribeToItems(callback) {
    if (!this.client) {
      console.error('Cliente Supabase não disponível');
      return null;
    }
    
    const subscription = this.client
      .channel('items-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items'
      }, (payload) => {
        console.log('🔄 Mudança na tabela items:', payload);
        callback(payload);
      })
      .subscribe();
    
    this.subscriptions.set('items', subscription);
    console.log('📡 Subscrito a mudanças na tabela items');
    return subscription;
  }
  
  // Subscrever mudanças na tabela de histórico
  subscribeToHistory(callback) {
    if (!this.client) {
      console.error('Cliente Supabase não disponível');
      return null;
    }
    
    const subscription = this.client
      .channel('history-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'history'
      }, (payload) => {
        console.log('🔄 Mudança na tabela history:', payload);
        callback(payload);
      })
      .subscribe();
    
    this.subscriptions.set('history', subscription);
    console.log('📡 Subscrito a mudanças na tabela history');
    return subscription;
  }
  
  // Subscrever mudanças na tabela de seleções de jogadores
  subscribeToPlayerSelections(callback) {
    if (!this.client) {
      console.error('Cliente Supabase não disponível');
      return null;
    }
    
    const subscription = this.client
      .channel('player-selections-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_selections'
      }, (payload) => {
        console.log('🔄 Mudança na tabela player_selections:', payload);
        callback(payload);
      })
      .subscribe();
    
    this.subscriptions.set('player_selections', subscription);
    console.log('📡 Subscrito a mudanças na tabela player_selections');
    return subscription;
  }
  
  // Remover subscription específica
  unsubscribe(tableName) {
    const subscription = this.subscriptions.get(tableName);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(tableName);
      console.log(`📡 Removida subscription da tabela ${tableName}`);
    }
  }
  
  // Remover todas as subscriptions
  unsubscribeAll() {
    for (const [tableName, subscription] of this.subscriptions) {
      subscription.unsubscribe();
      console.log(`📡 Removida subscription da tabela ${tableName}`);
    }
    this.subscriptions.clear();
    console.log('📡 Todas as subscriptions removidas');
  }
  
  // Verificar status das subscriptions
  getSubscriptionStatus() {
    const status = {};
    for (const [tableName, subscription] of this.subscriptions) {
      status[tableName] = {
        connected: subscription.state === 'SUBSCRIBED',
        state: subscription.state
      };
    }
    return status;
  }
}

// Instância global do gerenciador de realtime
let realtimeManager = null;

// Inicializar gerenciador de realtime
function initRealtimeManager() {
  if (!realtimeManager) {
    realtimeManager = new SupabaseRealtimeManager();
  }
  return realtimeManager;
}

// Obter gerenciador de realtime
function getRealtimeManager() {
  if (!realtimeManager) {
    realtimeManager = initRealtimeManager();
  }
  return realtimeManager;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.SupabaseRealtimeManager = SupabaseRealtimeManager;
  window.initSupabaseClient = initSupabaseClient;
  window.getSupabaseClient = getSupabaseClient;
  window.initRealtimeManager = initRealtimeManager;
  window.getRealtimeManager = getRealtimeManager;
  window.waitForSupabase = waitForSupabase;
}