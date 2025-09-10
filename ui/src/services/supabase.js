import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase - usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ofdlacirerempfjohgsj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGxhY2lyZXJlbXBmam9oZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNjg1NzUsImV4cCI6MjA3Mjk0NDU3NX0.1VOaD9QeDepJEZTiYtKrPTdfkBDcn2__jRnCfV-BZtU'

// Criar cliente Supabase - configurado para produção
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Forçar uso de cookies seguros em produção
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Configurações para produção
  global: {
    headers: {
      'X-Client-Info': 'sistema-itens-react@1.0.0'
    }
  }
})

// Log de configuração (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase configurado:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    environment: import.meta.env.MODE
  })
}

// Funções de API para o sistema
export class SupabaseAPI {
  // Players
  static async getPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  static async addPlayer(player) {
    const { data, error } = await supabase
      .from('players')
      .insert([player])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async updatePlayer(name, updates) {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('name', name)
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async deletePlayer(name) {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('name', name)
    
    if (error) throw error
  }

  // Items
  static async getItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  static async addItem(item) {
    const { data, error } = await supabase
      .from('items')
      .insert([item])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async updateItem(name, updates) {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('name', name)
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async deleteItem(name) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('name', name)
    
    if (error) throw error
  }

  // History
  static async getHistory() {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async addHistoryEntry(entry) {
    const { data, error } = await supabase
      .from('history')
      .insert([entry])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async deleteHistoryEntry(id) {
    const { error } = await supabase
      .from('history')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Player Selections
  static async getPlayerSelections() {
    const { data, error } = await supabase
      .from('player_selections')
      .select('*')
    
    if (error) throw error
    return data || []
  }

  static async savePlayerSelection(selection) {
    const { data, error } = await supabase
      .from('player_selections')
      .upsert([selection])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async deletePlayerSelection(playerName, itemName) {
    const { error } = await supabase
      .from('player_selections')
      .delete()
      .eq('player_name', playerName)
      .eq('item_name', itemName)
    
    if (error) throw error
  }

  // Released Items
  static async getReleasedItems() {
    const { data, error } = await supabase
      .from('released_items')
      .select('*')
    
    if (error) throw error
    return data || []
  }

  static async saveReleasedItem(item) {
    const { data, error } = await supabase
      .from('released_items')
      .upsert([item])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async clearReleasedItems() {
    const { error } = await supabase
      .from('released_items')
      .delete()
      .neq('id', 0) // Delete all
    
    if (error) throw error
  }

  // Realtime subscriptions
  static subscribeToPlayers(callback) {
    return supabase
      .channel('players-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'players' },
        callback
      )
      .subscribe()
  }

  static subscribeToItems(callback) {
    return supabase
      .channel('items-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'items' },
        callback
      )
      .subscribe()
  }

  static subscribeToHistory(callback) {
    return supabase
      .channel('history-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'history' },
        callback
      )
      .subscribe()
  }

  static subscribeToPlayerSelections(callback) {
    return supabase
      .channel('player-selections-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'player_selections' },
        callback
      )
      .subscribe()
  }

  static subscribeToReleasedItems(callback) {
    return supabase
      .channel('released-items-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'released_items' },
        callback
      )
      .subscribe()
  }
}

export default supabase