// Configurações do sistema
const CONFIG = {
  // URL da função Netlify para API do Supabase
  NETLIFY_FUNCTION_URL: '/.netlify/functions/supabase-api',
  
  // Configurações do Supabase
  SUPABASE: {
    URL: 'https://your-project.supabase.co', // Substituir pela URL real
    ANON_KEY: 'your-anon-key' // Substituir pela chave real
  },
  
  // ID da planilha do Google Sheets (mantido para compatibilidade)
  SPREADSHEET_ID: '1MTQcyUr7vX79-hZGYbFrLqMZzvB2SVxl5OjJLTE3n_4',
  
  // Nomes das abas da planilha
  SHEETS: {
    PLAYERS: 'Jogadores',
    ITEMS: 'Itens',
    HISTORY: 'Histórico',
    CONFIG: 'Configurações'
  },
  
  // Configurações de cache
  CACHE: {
    DURATION: 5 * 60 * 1000, // 5 minutos em millisegundos
    KEY_PREFIX: 'guild_sheets_'
  },
  
  // Configurações de sincronização
  SYNC: {
    AUTO_SAVE_DELAY: 2000, // 2 segundos de delay para auto-save
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 segundo entre tentativas
  }
};

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}