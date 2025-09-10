// Configurações do sistema
const CONFIG = {
  // URL da função Netlify para API do Supabase
  NETLIFY_FUNCTION_URL: '/.netlify/functions/supabase-api',
  
  // Configurações do Supabase
  SUPABASE: {
    URL: 'https://ofdlacirerempfjohgsj.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGxhY2lyZXJlbXBmam9oZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNjg1NzUsImV4cCI6MjA3Mjk0NDU3NX0.1VOaD9QeDepJEZTiYtKrPTdfkBDcn2__jRnCfV-BZtU'
  },
  
  // Configurações de cache
  CACHE: {
    DURATION: 5 * 60 * 1000, // 5 minutos em millisegundos
    KEY_PREFIX: 'guild_cache_'
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