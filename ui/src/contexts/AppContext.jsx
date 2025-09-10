import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { SupabaseAPI } from '../services/supabase'

// Estado inicial
const initialState = {
  // Dados
  players: [],
  items: [],
  history: [],
  playerSelections: [],
  releasedItems: [],
  
  // UI State
  loading: false,
  error: null,
  currentUser: null,
  userRole: null, // 'admin' ou 'player'
  
  // Configurações
  theme: 'dark-red',
  autoSave: true,
  realTimeEnabled: true
}

// Actions
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PLAYERS: 'SET_PLAYERS',
  ADD_PLAYER: 'ADD_PLAYER',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  DELETE_PLAYER: 'DELETE_PLAYER',
  SET_ITEMS: 'SET_ITEMS',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  SET_HISTORY: 'SET_HISTORY',
  ADD_HISTORY_ENTRY: 'ADD_HISTORY_ENTRY',
  DELETE_HISTORY_ENTRY: 'DELETE_HISTORY_ENTRY',
  SET_PLAYER_SELECTIONS: 'SET_PLAYER_SELECTIONS',
  UPDATE_PLAYER_SELECTION: 'UPDATE_PLAYER_SELECTION',
  DELETE_PLAYER_SELECTION: 'DELETE_PLAYER_SELECTION',
  SET_RELEASED_ITEMS: 'SET_RELEASED_ITEMS',
  ADD_RELEASED_ITEM: 'ADD_RELEASED_ITEM',
  CLEAR_RELEASED_ITEMS: 'CLEAR_RELEASED_ITEMS',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_USER_ROLE: 'SET_USER_ROLE',
  SET_THEME: 'SET_THEME'
}

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    
    case ACTIONS.SET_PLAYERS:
      return { ...state, players: action.payload }
    
    case ACTIONS.ADD_PLAYER:
      return { ...state, players: [...state.players, action.payload] }
    
    case ACTIONS.UPDATE_PLAYER:
      return {
        ...state,
        players: state.players.map(player => 
          player.name === action.payload.name ? action.payload : player
        )
      }
    
    case ACTIONS.DELETE_PLAYER:
      return {
        ...state,
        players: state.players.filter(player => player.name !== action.payload)
      }
    
    case ACTIONS.SET_ITEMS:
      return { ...state, items: action.payload }
    
    case ACTIONS.ADD_ITEM:
      return { ...state, items: [...state.items, action.payload] }
    
    case ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map(item => 
          item.name === action.payload.name ? action.payload : item
        )
      }
    
    case ACTIONS.DELETE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.name !== action.payload)
      }
    
    case ACTIONS.SET_HISTORY:
      return { ...state, history: action.payload }
    
    case ACTIONS.ADD_HISTORY_ENTRY:
      return { ...state, history: [action.payload, ...state.history] }
    
    case ACTIONS.DELETE_HISTORY_ENTRY:
      return {
        ...state,
        history: state.history.filter(entry => entry.id !== action.payload)
      }
    
    case ACTIONS.SET_PLAYER_SELECTIONS:
      return { ...state, playerSelections: action.payload }
    
    case ACTIONS.UPDATE_PLAYER_SELECTION:
      const existingIndex = state.playerSelections.findIndex(
        sel => sel.player_name === action.payload.player_name && 
               sel.item_name === action.payload.item_name
      )
      
      if (existingIndex >= 0) {
        const updated = [...state.playerSelections]
        updated[existingIndex] = action.payload
        return { ...state, playerSelections: updated }
      } else {
        return { ...state, playerSelections: [...state.playerSelections, action.payload] }
      }
    
    case ACTIONS.DELETE_PLAYER_SELECTION:
      return {
        ...state,
        playerSelections: state.playerSelections.filter(
          sel => !(sel.player_name === action.payload.playerName && 
                  sel.item_name === action.payload.itemName)
        )
      }
    
    case ACTIONS.SET_RELEASED_ITEMS:
      return { ...state, releasedItems: action.payload }
    
    case ACTIONS.ADD_RELEASED_ITEM:
      return { ...state, releasedItems: [...state.releasedItems, action.payload] }
    
    case ACTIONS.CLEAR_RELEASED_ITEMS:
      return { ...state, releasedItems: [] }
    
    case ACTIONS.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload }
    
    case ACTIONS.SET_USER_ROLE:
      return { ...state, userRole: action.payload }
    
    case ACTIONS.SET_THEME:
      return { ...state, theme: action.payload }
    
    default:
      return state
  }
}

// Context
const AppContext = createContext()

// Provider
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  // Configurar subscriptions em tempo real
  useEffect(() => {
    if (!state.realTimeEnabled) return

    const subscriptions = []

    // Players subscription
    const playersSubscription = SupabaseAPI.subscribeToPlayers((payload) => {
      console.log('Players realtime update:', payload)
      loadPlayers()
    })
    subscriptions.push(playersSubscription)

    // Items subscription
    const itemsSubscription = SupabaseAPI.subscribeToItems((payload) => {
      console.log('Items realtime update:', payload)
      loadItems()
    })
    subscriptions.push(itemsSubscription)

    // History subscription
    const historySubscription = SupabaseAPI.subscribeToHistory((payload) => {
      console.log('History realtime update:', payload)
      loadHistory()
    })
    subscriptions.push(historySubscription)

    // Player selections subscription
    const selectionsSubscription = SupabaseAPI.subscribeToPlayerSelections((payload) => {
      console.log('Player selections realtime update:', payload)
      loadPlayerSelections()
    })
    subscriptions.push(selectionsSubscription)

    // Released items subscription
    const releasedSubscription = SupabaseAPI.subscribeToReleasedItems((payload) => {
      console.log('Released items realtime update:', payload)
      loadReleasedItems()
    })
    subscriptions.push(releasedSubscription)

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(subscription => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe()
        }
      })
    }
  }, [state.realTimeEnabled])

  // Funções de carregamento
  const loadInitialData = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    try {
      await Promise.all([
        loadPlayers(),
        loadItems(),
        loadHistory(),
        loadPlayerSelections(),
        loadReleasedItems()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  const loadPlayers = async () => {
    try {
      const players = await SupabaseAPI.getPlayers()
      dispatch({ type: ACTIONS.SET_PLAYERS, payload: players })
    } catch (error) {
      console.error('Erro ao carregar players:', error)
    }
  }

  const loadItems = async () => {
    try {
      const items = await SupabaseAPI.getItems()
      dispatch({ type: ACTIONS.SET_ITEMS, payload: items })
    } catch (error) {
      console.error('Erro ao carregar items:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const history = await SupabaseAPI.getHistory()
      dispatch({ type: ACTIONS.SET_HISTORY, payload: history })
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const loadPlayerSelections = async () => {
    try {
      const selections = await SupabaseAPI.getPlayerSelections()
      dispatch({ type: ACTIONS.SET_PLAYER_SELECTIONS, payload: selections })
    } catch (error) {
      console.error('Erro ao carregar seleções:', error)
    }
  }

  const loadReleasedItems = async () => {
    try {
      const releasedItems = await SupabaseAPI.getReleasedItems()
      dispatch({ type: ACTIONS.SET_RELEASED_ITEMS, payload: releasedItems })
    } catch (error) {
      console.error('Erro ao carregar itens liberados:', error)
    }
  }

  // Actions para componentes
  const actions = {
    // Players
    addPlayer: async (player) => {
      try {
        const newPlayer = await SupabaseAPI.addPlayer(player)
        dispatch({ type: ACTIONS.ADD_PLAYER, payload: newPlayer })
        return newPlayer
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    updatePlayer: async (name, updates) => {
      try {
        const updatedPlayer = await SupabaseAPI.updatePlayer(name, updates)
        dispatch({ type: ACTIONS.UPDATE_PLAYER, payload: updatedPlayer })
        return updatedPlayer
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    deletePlayer: async (name) => {
      try {
        await SupabaseAPI.deletePlayer(name)
        dispatch({ type: ACTIONS.DELETE_PLAYER, payload: name })
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    // Items
    addItem: async (item) => {
      try {
        const newItem = await SupabaseAPI.addItem(item)
        dispatch({ type: ACTIONS.ADD_ITEM, payload: newItem })
        return newItem
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    updateItem: async (name, updates) => {
      try {
        const updatedItem = await SupabaseAPI.updateItem(name, updates)
        dispatch({ type: ACTIONS.UPDATE_ITEM, payload: updatedItem })
        return updatedItem
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    deleteItem: async (name) => {
      try {
        await SupabaseAPI.deleteItem(name)
        dispatch({ type: ACTIONS.DELETE_ITEM, payload: name })
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    // History
    addHistoryEntry: async (entry) => {
      try {
        const newEntry = await SupabaseAPI.addHistoryEntry(entry)
        dispatch({ type: ACTIONS.ADD_HISTORY_ENTRY, payload: newEntry })
        return newEntry
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    deleteHistoryEntry: async (id) => {
      try {
        await SupabaseAPI.deleteHistoryEntry(id)
        dispatch({ type: ACTIONS.DELETE_HISTORY_ENTRY, payload: id })
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    // Player Selections
    savePlayerSelection: async (selection) => {
      try {
        const savedSelection = await SupabaseAPI.savePlayerSelection(selection)
        dispatch({ type: ACTIONS.UPDATE_PLAYER_SELECTION, payload: savedSelection })
        return savedSelection
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    deletePlayerSelection: async (playerName, itemName) => {
      try {
        await SupabaseAPI.deletePlayerSelection(playerName, itemName)
        dispatch({ type: ACTIONS.DELETE_PLAYER_SELECTION, payload: { playerName, itemName } })
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    // Released Items
    saveReleasedItem: async (item) => {
      try {
        const savedItem = await SupabaseAPI.saveReleasedItem(item)
        dispatch({ type: ACTIONS.ADD_RELEASED_ITEM, payload: savedItem })
        return savedItem
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    clearReleasedItems: async () => {
      try {
        await SupabaseAPI.clearReleasedItems()
        dispatch({ type: ACTIONS.CLEAR_RELEASED_ITEMS })
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
        throw error
      }
    },

    // UI Actions
    setCurrentUser: (user) => {
      dispatch({ type: ACTIONS.SET_CURRENT_USER, payload: user })
    },

    setUserRole: (role) => {
      dispatch({ type: ACTIONS.SET_USER_ROLE, payload: role })
    },

    setTheme: (theme) => {
      dispatch({ type: ACTIONS.SET_THEME, payload: theme })
    },

    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null })
    },

    // Utility actions
    refreshData: loadInitialData
  }

  const value = {
    ...state,
    ...actions,
    // Propriedade calculada para verificar se o usuário está autenticado
    isAuthenticated: !!state.currentUser && !!state.userRole
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Hook para usar o contexto
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider')
  }
  return context
}

export default AppContext