// Sistema de Loot de Guilda - Versão Otimizada

const DEFAULT_ITEMS = [
  "Cristal do Caos",
  "Pena do Condor",
  "Chama do Condor",
  "Despertar",
  "Arcanjo",
];

// Removido STORAGE_KEY - dados são salvos apenas no servidor

function loadState() {
    // Estado será carregado automaticamente do servidor via setupServerIntegration
    console.log('Carregando dados do servidor...');
    return null;
}

function saveState(state) {
    try {
      // Verificar se está conectado ao servidor
      if (!window.realtimeClient || !window.realtimeClient.isConnected) {
        notifications.error('Erro: Não conectado ao servidor. Verifique sua conexão.');
        return;
      }
      
      // Salvar no servidor
      window.realtimeClient.updateData(state);
      
      // Invalidar cache quando dados são salvos
      invalidateCache();
      
      if (typeof notifications !== 'undefined') {
            notifications.success('Estado salvo no servidor!');
        }
    } catch (error) {
        console.error('Erro ao salvar estado:', error);
        if (typeof notifications !== 'undefined') {
            notifications.error('Erro ao salvar no servidor');
        }
    }
  }

function createEmptyState() {
  return {
    players: [],
    items: [...DEFAULT_ITEMS],
    history: [],
    ui: { editUnlocked: false },
    rotation: {}
  };
}

let state = loadState() || createEmptyState();

if (!state.rotation) state.rotation = {};

if (state.players) state.players.forEach((p) => { 
  if (!p.counts) p.counts = {};
  if (p.active === undefined) p.active = true;
});
if (!state.ui) state.ui = { editUnlocked: false };

// Utilitários
function fmtDate(d = new Date()) {
  return d.toLocaleDateString('pt-BR');
}

function showSection(id) {
  // Esconder todas as seções
  document.querySelectorAll('.panel').forEach(s => s.classList.add('hidden'));
  
  // Mostrar a seção selecionada
  const targetSection = document.getElementById(`section-${id}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }
  
  // Atualizar botões de navegação
  document.querySelectorAll('.side-link').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-target="#section-${id}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // Renderizar conteúdo específico da seção
  if (id === 'dashboard') renderDashboard();
  if (id === 'distribuir') initDistributeModal();
  if (id === 'cadastros') {
    renderItemsManager();
    renderPlayersManager();
  }
  if (id === 'historico') renderHistory();
}

// Sistema de cache inteligente
const cache = {
  // Cache de renderização
  render: {
    lastPlayersHash: '',
    lastItemsHash: '',
    lastUIHash: '',
    cachedRows: new Map()
  },
  // Cache de dados computados
  computed: {
    rankings: new Map(),
    statistics: new Map(),
    suggestions: new Map(),
    lastUpdate: 0
  },
  // Configurações do cache
  config: {
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxEntries: 100
  }
};

// Sistema de notificações não-intrusivas
const notifications = {
  container: null,
  queue: [],
  maxVisible: 3,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'notifications-container';
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info', duration = 4000) {
    this.init();
    
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration
    };
    
    this.queue.push(notification);
    this.processQueue();
    
    return notification.id;
  },
  
  processQueue() {
    const visible = this.container.children.length;
    if (visible >= this.maxVisible || this.queue.length === 0) return;
    
    const notification = this.queue.shift();
    this.createNotificationElement(notification);
    
    // Processar próxima da fila após um pequeno delay
    setTimeout(() => this.processQueue(), 100);
  },
  
  createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.dataset.id = notification.id;
    
    element.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getIcon(notification.type)}</span>
        <span class="notification-message">${notification.message}</span>
        <button class="notification-close" onclick="notifications.dismiss('${notification.id}')">&times;</button>
      </div>
    `;
    
    this.container.appendChild(element);
    
    // Animação de entrada
    requestAnimationFrame(() => {
      element.classList.add('notification-show');
    });
    
    // Auto-dismiss
    if (notification.duration > 0) {
      setTimeout(() => this.dismiss(notification.id), notification.duration);
    }
  },
  
  dismiss(id) {
    const element = this.container.querySelector(`[data-id="${id}"]`);
    if (!element) return;
    
    element.classList.add('notification-hide');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.processQueue();
    }, 300);
  },
  
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  },
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
     return this.show(message, 'info', duration);
   }
 };

// Sistema de drag-and-drop melhorado
const dragDrop = {
   draggedElement: null,
   draggedIndex: null,
   placeholder: null,
   
   init() {
     this.createPlaceholder();
   },
   
   createPlaceholder() {
     this.placeholder = document.createElement('tr');
     this.placeholder.className = 'drag-placeholder';
     this.placeholder.innerHTML = '<td colspan="100%"><div class="placeholder-content">Solte aqui para reordenar</div></td>';
   },
   
   makeDraggable(element, index) {
     element.draggable = true;
     element.dataset.dragIndex = index;
     
     element.addEventListener('dragstart', (e) => this.handleDragStart(e, element, index));
     element.addEventListener('dragend', (e) => this.handleDragEnd(e));
     element.addEventListener('dragover', (e) => this.handleDragOver(e));
     element.addEventListener('drop', (e) => this.handleDrop(e, index));
     element.addEventListener('dragenter', (e) => this.handleDragEnter(e));
     element.addEventListener('dragleave', (e) => this.handleDragLeave(e));
   },
   
   handleDragStart(e, element, index) {
     this.draggedElement = element;
     this.draggedIndex = index;
     
     element.classList.add('dragging');
     e.dataTransfer.effectAllowed = 'move';
     e.dataTransfer.setData('text/html', element.outerHTML);
     
     // Feedback visual melhorado
     setTimeout(() => {
       element.style.opacity = '0.5';
     }, 0);
   },
   
   handleDragEnd(e) {
     if (this.draggedElement) {
       this.draggedElement.classList.remove('dragging');
       this.draggedElement.style.opacity = '';
     }
     
     // Remover placeholder se ainda estiver na DOM
     if (this.placeholder.parentNode) {
       this.placeholder.parentNode.removeChild(this.placeholder);
     }
     
     // Limpar referências
     this.draggedElement = null;
     this.draggedIndex = null;
     
     // Remover classes de hover de todos os elementos
     document.querySelectorAll('.drag-over').forEach(el => {
       el.classList.remove('drag-over');
     });
   },
   
   handleDragOver(e) {
     e.preventDefault();
     e.dataTransfer.dropEffect = 'move';
   },
   
   handleDragEnter(e) {
     e.preventDefault();
     if (this.draggedElement && e.target.closest('tr') !== this.draggedElement) {
       const targetRow = e.target.closest('tr');
       if (targetRow && !targetRow.classList.contains('drag-placeholder')) {
         targetRow.classList.add('drag-over');
         
         // Inserir placeholder
         const targetIndex = parseInt(targetRow.dataset.dragIndex);
         if (targetIndex < this.draggedIndex) {
           targetRow.parentNode.insertBefore(this.placeholder, targetRow);
         } else {
           targetRow.parentNode.insertBefore(this.placeholder, targetRow.nextSibling);
         }
       }
     }
   },
   
   handleDragLeave(e) {
     const targetRow = e.target.closest('tr');
     if (targetRow) {
       targetRow.classList.remove('drag-over');
     }
   },
   
   handleDrop(e, targetIndex) {
     e.preventDefault();
     
     if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
       return;
     }
     
     // Reordenar array de jogadores
     const draggedPlayer = state.players[this.draggedIndex];
     state.players.splice(this.draggedIndex, 1);
     
     // Ajustar índice se necessário
     const newIndex = this.draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
     state.players.splice(newIndex, 0, draggedPlayer);
     
     // Salvar estado e re-renderizar
     saveState(state);
     renderTable();
     
     // Notificação de sucesso
     notifications.success(`${draggedPlayer.name} reordenado com sucesso!`);
   }
  };



// Função para limpar cache expirado
function cleanExpiredCache() {
  const now = Date.now();
  const maxAge = cache.config.maxAge;
  
  // Limpar cache computado expirado
  for (const [key, data] of cache.computed.rankings) {
    if (now - data.timestamp > maxAge) {
      cache.computed.rankings.delete(key);
    }
  }
  
  for (const [key, data] of cache.computed.statistics) {
    if (now - data.timestamp > maxAge) {
      cache.computed.statistics.delete(key);
    }
  }
  
  for (const [key, data] of cache.computed.suggestions) {
    if (now - data.timestamp > maxAge) {
      cache.computed.suggestions.delete(key);
    }
  }
  
  // Limitar tamanho do cache de renderização
  if (cache.render.cachedRows.size > cache.config.maxEntries) {
    const entries = Array.from(cache.render.cachedRows.entries());
    const toDelete = entries.slice(0, entries.length - cache.config.maxEntries);
    toDelete.forEach(([key]) => cache.render.cachedRows.delete(key));
  }
}

// Função para invalidar todo o cache
function invalidateCache() {
  cache.render.lastPlayersHash = '';
  cache.render.lastItemsHash = '';
  cache.render.lastUIHash = '';
  cache.render.cachedRows.clear();
  cache.computed.rankings.clear();
  cache.computed.statistics.clear();
  cache.computed.suggestions.clear();
}

let renderCache = cache.render;

function generateDataHash(players, items, ui) {
  return JSON.stringify({players, items, ui}).length.toString();
}

// Configuração de virtualização
const VIRTUAL_CONFIG = {
  itemHeight: 45, // altura estimada de cada linha
  containerHeight: 400, // altura do container visível
  buffer: 5 // linhas extras para renderizar fora da área visível
};

function renderTable() {
  const tbody = document.querySelector('#players-table tbody');
  if (!tbody) return;

  const players = state.players;
  const items = state.items;
  const ui = state.ui;
  
  // Verificar se precisa re-renderizar usando cache
  const playersHash = generateDataHash(players, [], {});
  const itemsHash = generateDataHash([], items, {});
  const uiHash = generateDataHash([], [], ui);
  
  if (renderCache.lastPlayersHash === playersHash && 
      renderCache.lastItemsHash === itemsHash && 
      renderCache.lastUIHash === uiHash) {
    return; // Usar cache
  }
  
  // Atualizar cache
  renderCache.lastPlayersHash = playersHash;
  renderCache.lastItemsHash = itemsHash;
  renderCache.lastUIHash = uiHash;
  
  const columns = items;
  const focus = ui.editUnlocked;
  const hasPlayersWithTwoFaults = players.some(p => 
    Object.values(p.counts).filter(count => count >= 2).length > 0
  );
  
  // Usar virtualização para listas grandes
  if (players.length > 50) {
    renderVirtualTable(tbody, players, columns, focus, hasPlayersWithTwoFaults);
  } else {
    renderStandardTable(tbody, players, columns, focus, hasPlayersWithTwoFaults);
  }
}

function renderVirtualTable(tbody, players, columns, focus, hasPlayersWithTwoFaults) {
  // Implementação simplificada de virtualização
  const container = tbody.parentElement;
  const scrollTop = container.scrollTop || 0;
  const startIndex = Math.floor(scrollTop / VIRTUAL_CONFIG.itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(VIRTUAL_CONFIG.containerHeight / VIRTUAL_CONFIG.itemHeight) + VIRTUAL_CONFIG.buffer,
    players.length
  );
  
  tbody.innerHTML = '';
  
  // Renderizar apenas os itens visíveis
  for (let i = startIndex; i < endIndex; i++) {
    const player = players[i];
    if (player) {
      const row = createPlayerRow(player, columns, focus, hasPlayersWithTwoFaults, i);
      tbody.appendChild(row);
    }
  }
}

function renderStandardTable(tbody, players, columns, focus, hasPlayersWithTwoFaults) {
  tbody.innerHTML = '';
  players.forEach((player, index) => {
    const row = createPlayerRow(player, columns, focus, hasPlayersWithTwoFaults, index);
    
    // Tornar linha arrastável se estiver no modo de edição
    if (focus) {
      dragDrop.makeDraggable(row, index);
    }
    
    tbody.appendChild(row);
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Sistema de busca otimizado
const searchSystem = {
  currentQuery: '',
  filteredPlayers: [],
  
  // Busca otimizada com múltiplos critérios
  search(query) {
    if (!query.trim()) {
      this.filteredPlayers = [...state.players];
      this.currentQuery = '';
      return this.filteredPlayers;
    }
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    this.currentQuery = query;
    
    this.filteredPlayers = state.players.filter(player => {
      const playerName = player.name.toLowerCase();
      const playerStatus = player.active ? 'ativo' : 'inativo';
      
      // Busca por nome, status e contadores de itens
      return searchTerms.every(term => {
        return playerName.includes(term) || 
               playerStatus.includes(term) ||
               state.items.some(item => {
                 const count = player.counts[item] || 0;
                 return item.toLowerCase().includes(term) || count.toString().includes(term);
               });
      });
    });
    
    return this.filteredPlayers;
  },
  
  // Destacar termos encontrados
  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
};

// Busca com debounce
const debouncedSearch = debounce((query) => {
  const results = searchSystem.search(query);
  
  // Atualizar tabela com resultados filtrados
  const tbody = document.querySelector('#players-table tbody');
  if (tbody) {
    const columns = state.items;
    const focus = state.ui.editUnlocked;
    const hasPlayersWithTwoFaults = results.some(p => 
      Object.values(p.counts).filter(count => count >= 2).length > 0
    );
    
    tbody.innerHTML = '';
    results.forEach((player, index) => {
      const row = createPlayerRow(player, columns, focus, hasPlayersWithTwoFaults, index);
      
      // Tornar linha arrastável se estiver no modo de edição
      if (focus) {
        dragDrop.makeDraggable(row, index);
      }
      
      tbody.appendChild(row);
    });
  }
  
  updateSearchResults(results.length, query);
}, 300);

// Atualizar contador de resultados da busca
function updateSearchResults(count, query) {
  let counter = document.querySelector('.search-results-counter');
  
  if (!counter) {
    counter = document.createElement('div');
    counter.className = 'search-results-counter';
    const searchContainer = document.querySelector('.search');
    if (searchContainer) {
      searchContainer.appendChild(counter);
    }
  }
  
  if (query && query.trim()) {
    counter.textContent = `${count} resultado${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    counter.style.display = 'block';
    counter.classList.add('show');
    
    // Adicionar classe de busca ativa
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.classList.add('active-search');
    }
  } else {
    counter.style.display = 'none';
    counter.classList.remove('show');
    
    // Remover classe de busca ativa
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.classList.remove('active-search');
    }
  }
}

function createPlayerRow(player, columns, focus, hasPlayersWithTwoFaults, index) {
  const row = document.createElement('tr');
  row.className = player.active ? '' : 'inactive';
  
  // Adicionar classe para drag-and-drop se estiver no modo de edição
  if (focus) {
    row.classList.add('draggable-row');
  }
  
  // Usar cache para linhas já renderizadas
  const cacheKey = `${player.name}-${JSON.stringify(player.counts)}-${player.active}-${focus}`;
  if (renderCache.cachedRows.has(cacheKey)) {
    const cachedRow = renderCache.cachedRows.get(cacheKey);
    row.innerHTML = cachedRow;
    return row;
  }
  
  let html = '';
  
  // Coluna de posição com drag handle
  if (focus) {
    html += `<td class="position-cell">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="drag-handle" title="Arrastar para reordenar">⋮⋮</span>
        <span>${index + 1}</span>
      </div>
    </td>`;
  } else {
    html += `<td class="position-cell">${index + 1}</td>`;
  }
  
  // Nome do jogador com destaque de busca
  const highlightedName = searchSystem.currentQuery ? 
    searchSystem.highlightMatch(player.name, searchSystem.currentQuery) : player.name;
  
  html += `<td class="player-name">${highlightedName}</td>`;
  
  // Colunas de itens
  columns.forEach(item => {
    const count = player.counts[item] || 0;
    const isTwoOrMore = count >= 2;
    const cellClass = isTwoOrMore && hasPlayersWithTwoFaults ? 'two-or-more' : '';
    
    if (focus) {
      html += `<td class="${cellClass}"><input type="number" min="0" value="${count}" onchange="updatePlayerCount('${player.name}', '${item}', this.value)" /></td>`;
    } else {
      html += `<td class="${cellClass}">${count}</td>`;
    }
  });
  
  // Ações
  if (focus) {
    html += `<td class="actions">`;
    html += `<button onclick="suggestForPlayer('${player.name}')" class="suggest-btn" title="Sugerir item">🎯</button>`;
    html += `<button onclick="togglePlayerActive('${player.name}')" class="toggle-btn" title="${player.active ? 'Desativar' : 'Ativar'}">${player.active ? '👁️' : '👁️‍🗨️'}</button>`;
    html += `<button onclick="movePlayerToEnd('${player.name}')" class="move-btn" title="Mover para o fim">⬇️</button>`;
    html += `<button onclick="removePlayer('${player.name}')" class="remove-btn" title="Remover jogador">🗑️</button>`;
    html += `</td>`;
  }
  
  row.innerHTML = html;
  
  // Armazenar no cache
  renderCache.cachedRows.set(cacheKey, html);
  
  return row;
}

// Ordenação otimizada
let sortState = { col: "", asc: true };
function sortBy(col) {
  if (sortState.col === col) {
    sortState.asc = !sortState.asc;
  } else {
    sortState.col = col;
    sortState.asc = true;
  }
  
  // Pré-calcular valores de ordenação para evitar computações repetidas
  const playersWithSortValues = state.players.map(player => {
    let sortValue;
    
    if (col === "name") {
      sortValue = player.name.toLowerCase();
    } else if (col === "total") {
      sortValue = Object.values(player.counts).reduce((sum, count) => sum + count, 0);
    } else if (col === "active") {
      sortValue = player.active ? 1 : 0;
    } else {
      sortValue = player.counts[col] || 0;
    }
    
    return { player, sortValue };
  });
  
  // Ordenar usando valores pré-calculados
  playersWithSortValues.sort((a, b) => {
    if (typeof a.sortValue === 'string') {
      return sortState.asc ? 
        a.sortValue.localeCompare(b.sortValue) : 
        b.sortValue.localeCompare(a.sortValue);
    } else {
      return sortState.asc ? 
        a.sortValue - b.sortValue : 
        b.sortValue - a.sortValue;
    }
  });
  
  // Extrair jogadores ordenados
  state.players = playersWithSortValues.map(item => item.player);
  
  saveState(state);
  renderTable();
}

// Sugestão otimizada com cache
function suggestFor(item, availablePlayers = null, previewMode = false) {
  // Verificar cache primeiro
  const cacheKey = `${item}-${availablePlayers ? availablePlayers.map(p => p.name).join(',') : 'all'}`;
  const cachedResult = cache.computed.suggestions.get(cacheKey);
  
  if (cachedResult && Date.now() - cachedResult.timestamp < cache.config.maxAge) {
    return cachedResult.data;
  }
  
  const players = availablePlayers || state.players.filter(p => p.active);
  
  if (players.length === 0) return null;
  
  // Seleção linear O(n) em vez de ordenação O(n log n)
  let bestPlayer = null;
  let minCount = Infinity;
  let minTotal = Infinity;
  
  for (const player of players) {
    const itemCount = player.counts[item] || 0;
    const totalCount = Object.values(player.counts).reduce((sum, count) => sum + count, 0);
    
    // Priorizar: menor contagem do item, depois menor total
    if (itemCount < minCount || (itemCount === minCount && totalCount < minTotal)) {
      bestPlayer = player;
      minCount = itemCount;
      minTotal = totalCount;
    }
  }
  
  // Armazenar no cache
  const result = bestPlayer;
  cache.computed.suggestions.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  // Limpar cache se necessário
  cleanExpiredCache();
  
  return result;
}

// Distribuição em lote otimizada
function optimizedBatchDistribution(distributions) {
  // Agrupar atualizações por jogador para reduzir operações
  const playerUpdates = new Map();
  
  distributions.forEach(({ playerName, item }) => {
    if (!playerUpdates.has(playerName)) {
      playerUpdates.set(playerName, []);
    }
    playerUpdates.get(playerName).push(item);
  });
  
  // Aplicar todas as atualizações de uma vez
  playerUpdates.forEach((items, playerName) => {
    const player = state.players.find(p => p.name === playerName);
    if (player) {
      items.forEach(item => {
        player.counts[item] = (player.counts[item] || 0) + 1;
      });
    }
  });
  
  // Invalidar cache e salvar apenas uma vez
  invalidateCache();
  saveState(state);
}

function showToast(msg) {
  notifications.info(msg);
}

function exportData() {
  try {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guild_loot_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notifications.success(`Dados exportados com sucesso! ${state.players.length} jogadores salvos.`);
  } catch (error) {
    notifications.error('Erro ao exportar dados: ' + error.message);
  }
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Validar estrutura dos dados
      if (!importedData.players || !Array.isArray(importedData.players)) {
        throw new Error('Formato de dados inválido');
      }
      
      // Fazer backup do estado atual
      const backup = {...state};
      
      // Aplicar dados importados
      state = {...createEmptyState(), ...importedData};
      
      // Garantir que todos os jogadores tenham as propriedades necessárias
      state.players.forEach(player => {
        if (!player.counts) player.counts = {};
        if (player.active === undefined) player.active = true;
      });
      
      saveState(state);
      renderTable();
      updateSummaryCards();
      
      notifications.success(`Dados importados com sucesso! ${state.players.length} jogadores carregados.`);
    } catch (error) {
      notifications.error('Erro ao importar dados: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}

function movePlayerToEnd(playerName) {
  const playerIndex = state.players.findIndex(p => p.name === playerName);
  if (playerIndex !== -1) {
    const player = state.players.splice(playerIndex, 1)[0];
    state.players.push(player);
    saveState(state);
    renderTable();
    notifications.info(`${playerName} movido para o final da lista.`);
  }
}

function togglePlayerActive(playerName) {
  const player = state.players.find(p => p.name === playerName);
  if (player) {
    player.active = !player.active;
    saveState(state);
    renderTable();
    updateSummaryCards();
    notifications.info(`${playerName} ${player.active ? 'ativado' : 'desativado'}.`);
  }
}

function removePlayer(playerName) {
  if (confirm(`Tem certeza que deseja remover ${playerName}?`)) {
    const playerIndex = state.players.findIndex(p => p.name === playerName);
    if (playerIndex !== -1) {
      state.players.splice(playerIndex, 1);
      saveState(state);
      renderTable();
      updateSummaryCards();
      notifications.success(`${playerName} removido com sucesso.`);
    }
  }
}

function updatePlayerCount(playerName, item, newCount) {
  const player = state.players.find(p => p.name === playerName);
  if (player) {
    const oldCount = player.counts[item] || 0;
    player.counts[item] = Math.max(0, parseInt(newCount) || 0);
    
    if (oldCount !== player.counts[item]) {
      saveState(state);
      notifications.info(`${playerName}: ${item} atualizado para ${player.counts[item]}.`);
    }
  }
}

function suggestForPlayer(playerName) {
  const player = state.players.find(p => p.name === playerName);
  if (!player) return;
  
  // Encontrar o item com menor contagem para este jogador
  let bestItem = null;
  let minCount = Infinity;
  
  state.items.forEach(item => {
    const count = player.counts[item] || 0;
    if (count < minCount) {
      minCount = count;
      bestItem = item;
    }
  });
  
  if (bestItem) {
    notifications.info(`Sugestão para ${playerName}: ${bestItem} (atual: ${minCount})`);
  } else {
    notifications.warning(`Nenhuma sugestão disponível para ${playerName}.`);
  }
}

function updateSummaryCards() {
  const container = document.getElementById('dash-stats');
  if (!container) return;
  
  // Verificar cache de estatísticas
  const cacheKey = 'summary-stats';
  const cachedStats = cache.computed.statistics.get(cacheKey);
  
  if (cachedStats && Date.now() - cachedStats.timestamp < cache.config.maxAge) {
    container.innerHTML = cachedStats.data;
    return;
  }
  
  // Computar estatísticas
  const totalPlayers = state.players.length;
  const activePlayers = state.players.filter(p => p.active).length;
  const totalItems = state.items.length;
  const totalDistributions = state.players.reduce((sum, player) => {
    return sum + Object.values(player.counts).reduce((pSum, count) => pSum + count, 0);
  }, 0);
  
  // Gerar HTML
  const html = `
    <div class="summary-card">
      <h3>Jogadores</h3>
      <div class="stat-value">${activePlayers}/${totalPlayers}</div>
      <div class="stat-label">Ativos/Total</div>
    </div>
    <div class="summary-card">
      <h3>Itens</h3>
      <div class="stat-value">${totalItems}</div>
      <div class="stat-label">Cadastrados</div>
    </div>
    <div class="summary-card">
      <h3>Distribuições</h3>
      <div class="stat-value">${totalDistributions}</div>
      <div class="stat-label">Total</div>
    </div>
    <div class="summary-card">
      <h3>Média</h3>
      <div class="stat-value">${activePlayers > 0 ? (totalDistributions / activePlayers).toFixed(1) : '0'}</div>
      <div class="stat-label">Por jogador</div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Armazenar no cache
  cache.computed.statistics.set(cacheKey, {
    data: html,
    timestamp: Date.now()
  });
}

function setupRowDragAndDrop(tbody) {
  // Implementação de drag and drop será adicionada posteriormente
}

function renderItemsManager() {
  // Implementação será adicionada posteriormente
}

function renderPlayersManager() {
  // Implementação será adicionada posteriormente
}

function renderHistory() {
  // Implementação será adicionada posteriormente
}

function renderDashboard() {
  // Implementação será adicionada posteriormente
}

function initDistributeModal() {
  // Implementação será adicionada posteriormente
}

// Função para navegar para configurações
function goToConfig() {
  window.location.href = 'config.html';
}

// Sistema de shortcuts de teclado
const keyboardShortcuts = {
  // Navegação
  '1': () => showSection('dashboard'),
  '2': () => showSection('distribuir'),
  '3': () => showSection('cadastros'),
  '4': () => showSection('historico'),
  
  // Busca
  '/': () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  },
  
  // Ações
  'n': () => {
    // Novo jogador (se estiver na seção de cadastros)
    const currentSection = document.querySelector('.panel:not(.hidden)');
    if (currentSection && currentSection.id === 'section-cadastros') {
      const addPlayerBtn = document.getElementById('btn-add-player');
      if (addPlayerBtn) addPlayerBtn.click();
    }
  },
  
  'e': () => {
    // Toggle modo de edição
    const editBtn = document.getElementById('btn-toggle-edit');
    if (editBtn) editBtn.click();
  },
  
  'r': () => {
    // Resetar dados
    if (confirm('Tem certeza que deseja resetar todos os dados?')) {
      const resetBtn = document.getElementById('btn-reset');
      if (resetBtn) resetBtn.click();
    }
  }
};

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignorar se estiver digitando em um input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Permitir Escape para sair de inputs
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }
    
    // Verificar se é um shortcut válido
    const shortcut = keyboardShortcuts[e.key];
    if (shortcut) {
      e.preventDefault();
      shortcut();
      
      // Mostrar feedback visual
      showKeyboardFeedback(e.key);
    }
  });
}

function showKeyboardFeedback(key) {
  // Criar elemento de feedback
  const feedback = document.createElement('div');
  feedback.className = 'keyboard-feedback';
  feedback.textContent = `Tecla: ${key}`;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--primary-color, #007bff);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10000;
    animation: fadeInOut 1.5s ease-in-out;
  `;
  
  document.body.appendChild(feedback);
  
  // Remover após animação
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.parentNode.removeChild(feedback);
    }
  }, 1500);
}

// Funções básicas de inicialização
function wireEvents() {
  // Configurar busca em tempo real
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    // Limpar busca anterior
    searchInput.value = '';
    
    // Event listener para busca em tempo real
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      debouncedSearch(query);
    });
    
    // Limpar busca com Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.target.value = '';
        debouncedSearch('');
        e.target.blur();
      }
    });
    
    // Placeholder dinâmico
    searchInput.placeholder = `Buscar entre ${state.players.length} jogadores... (ou pressione '/' para focar)`;
  }
  
  // Configurar navegação da sidebar
  document.querySelectorAll('.side-link[data-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.currentTarget.getAttribute('data-target');
      if (target) {
        const sectionId = target.replace('#section-', '');
        showSection(sectionId);
      }
    });
  });
  
  // Configurar shortcuts de teclado
  setupKeyboardShortcuts();
}

function wireSidebar() {
  // Sidebar já funciona com os event listeners existentes
}

function wireDistributeModal() {
  // Modal já funciona com os event listeners existentes
}

function wireResultsModal() {
  // Modal já funciona com os event listeners existentes
}

function wireWinnersPreviewModal() {
  // Modal já funciona com os event listeners existentes
}

// Inicialização da aplicação
function initializeApp() {
  try {
    loadState();
    
    // Limpar cache expirado na inicialização
    cleanExpiredCache();
    
    // Configurar limpeza periódica do cache (a cada 5 minutos)
    setInterval(cleanExpiredCache, 5 * 60 * 1000);
    
    renderTable();
    updateSummaryCards();
    wireEvents();
    
    // Inicializar sistemas
     dragDrop.init();
     
     // Configurar integração com servidor (obrigatória)
     setupServerIntegration();
     
     // Estado será carregado automaticamente do servidor
     // Não há mais carregamento de dados locais
     
     notifications.success('Sistema de Loot de Guilda carregado com sucesso!');
     console.log('Aplicação inicializada com sucesso');
  } catch (error) {
     console.error('initializeApp: Erro ao inicializar aplicação:', error);
     notifications.error('Erro ao inicializar aplicação. Verifique o console para mais detalhes.');
   }
 }

 // Funções para integração com servidor
 function setupServerIntegration() {
    // Aguardar o cliente de tempo real estar disponível
    if (!window.realtimeClient) {
        console.log('Aguardando cliente de tempo real...');
        setTimeout(() => setupServerIntegration(), 500);
        return;
    }
    
    console.log('Cliente de tempo real disponível, configurando integração...');
   
   // Funções globais para o cliente de tempo real
   window.loadStateFromData = function(data) {
     try {
       if (data && data.players) {
         // Atualizar estado global
         Object.assign(state, data);
         
         // Re-renderizar interface
         renderTable();
         updateSummaryCards();
         
         console.log('Estado carregado do servidor:', data);
       }
     } catch (error) {
       console.error('Erro ao carregar dados do servidor:', error);
     }
   };

   window.addPlayerFromServer = function(player) {
     try {
       // Verificar se jogador já existe
       const existingIndex = state.players.findIndex(p => p.name === player.name);
       if (existingIndex === -1) {
         state.players.push(player);
         renderTable();
         updateSummaryCards();
         console.log('Jogador adicionado do servidor:', player);
       }
     } catch (error) {
       console.error('Erro ao adicionar jogador do servidor:', error);
     }
   };

   window.updatePlayerFromServer = function(player) {
     try {
       const index = state.players.findIndex(p => p.name === player.name);
       if (index !== -1) {
         state.players[index] = { ...state.players[index], ...player };
         renderTable();
         updateSummaryCards();
         console.log('Jogador atualizado do servidor:', player);
       }
     } catch (error) {
       console.error('Erro ao atualizar jogador do servidor:', error);
     }
   };

   window.removePlayerFromServer = function(playerId) {
     try {
       const index = state.players.findIndex(p => p.name === playerId);
       if (index !== -1) {
         state.players.splice(index, 1);
         renderTable();
         updateSummaryCards();
         console.log('Jogador removido do servidor:', playerId);
       }
     } catch (error) {
       console.error('Erro ao remover jogador do servidor:', error);
     }
   };

   // Configurar handlers para dados recebidos do servidor
   window.realtimeClient.onDataUpdate = (data) => {
     window.loadStateFromData(data);
   };
   
   window.realtimeClient.onPlayerUpdate = (playerData) => {
     window.updatePlayerFromServer(playerData);
   };
   
   window.realtimeClient.onPlayerAdd = (playerData) => {
     window.addPlayerFromServer(playerData);
   };
   
   window.realtimeClient.onPlayerRemove = (playerId) => {
     window.removePlayerFromServer(playerId);
   };

   // Conectar ao servidor
   window.realtimeClient.connect();
   
   // Carregar dados iniciais quando conectar
   window.realtimeClient.onConnect = () => {
     if (window.realtimeClient.loadDataViaAPI) {
       window.realtimeClient.loadDataViaAPI()
         .then(data => {
           if (data && Object.keys(data).length > 0) {
             window.loadStateFromData(data);
             notifications.info('Dados carregados do servidor!');
           }
         })
         .catch(err => {
           console.log('Erro ao carregar dados do servidor:', err);
         });
     }
   };
   
   // Mostrar erro se não conseguir conectar
   window.realtimeClient.onDisconnect = () => {
     console.error('Conexão perdida com o servidor');
     if (typeof notifications !== 'undefined') {
       notifications.warning('Conexão perdida com o servidor');
     }
   };
 }

function main() {
  initializeApp();
  showSection('dashboard');
}

document.addEventListener('DOMContentLoaded', main);
