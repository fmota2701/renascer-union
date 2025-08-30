// ===== DASHBOARD STATS =====

async function updateDashboardStats() {
    // Buscar elementos pelos IDs corretos
    const totalPlayersElement = document.getElementById('totalPlayers');
    const totalItemsElement = document.getElementById('totalItems');
    const totalDistributionsElement = document.getElementById('totalDistributions');
    const participationsTodayElement = document.getElementById('participationsToday');
    
    try {
        // Buscar dados atualizados da API local
        const [currentPlayers, currentItems, currentDistributions] = await Promise.all([
            api.getPlayers(),
            api.getItems(),
            api.getDistributions()
        ]);
        
        const stats = {
            players: currentPlayers.length,
            items: currentItems.length,
            distributions: currentDistributions.length,
            participations: countParticipationsToday(currentPlayers)
        };
        
        // Atualizar cards do dashboard com os IDs corretos
        if (totalPlayersElement) totalPlayersElement.textContent = stats.players;
        if (totalItemsElement) totalItemsElement.textContent = stats.items;
        if (totalDistributionsElement) totalDistributionsElement.textContent = stats.distributions;
        if (participationsTodayElement) participationsTodayElement.textContent = stats.participations;
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas do dashboard:', error);
        // Em caso de erro, usar dados locais como fallback
        const stats = {
            players: players.length,
            items: items.length,
            distributions: distributions.length,
            participations: countParticipationsToday(players)
        };
        
        if (totalPlayersElement) totalPlayersElement.textContent = stats.players;
        if (totalItemsElement) totalItemsElement.textContent = stats.items;
        if (totalDistributionsElement) totalDistributionsElement.textContent = stats.distributions;
        if (participationsTodayElement) participationsTodayElement.textContent = stats.participations;
    }
}

function countParticipationsToday(playersList = players) {
    let count = 0;
    playersList.forEach(player => {
        const lastParticipation = localStorage.getItem(`lastParticipation_${player.id}`);
        if (checkIfParticipatedToday(lastParticipation)) {
            count++;
        }
    });
    return count;
}

// ===== DRAG AND DROP FUNCTIONALITY =====

let draggedPlayerElement = null;
let draggedPlayerIndex = null;

function initializePlayerDragAndDrop() {
    const playerCards = document.querySelectorAll('.player-card[draggable="true"]');
    
    playerCards.forEach(card => {
        card.addEventListener('dragstart', handlePlayerDragStart);
        card.addEventListener('dragover', handlePlayerDragOver);
        card.addEventListener('drop', handlePlayerDrop);
        card.addEventListener('dragend', handlePlayerDragEnd);
        card.addEventListener('dragenter', handlePlayerDragEnter);
        card.addEventListener('dragleave', handlePlayerDragLeave);
    });
}

function handlePlayerDragStart(e) {
    draggedPlayerElement = e.target;
    draggedPlayerIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handlePlayerDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handlePlayerDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('player-card') && e.target !== draggedPlayerElement) {
        e.target.classList.add('drag-over');
    }
}

function handlePlayerDragLeave(e) {
    if (e.target.classList.contains('player-card')) {
        e.target.classList.remove('drag-over');
    }
}

function handlePlayerDrop(e) {
    e.preventDefault();
    
    if (e.target.classList.contains('player-card') && e.target !== draggedPlayerElement) {
        const targetIndex = parseInt(e.target.dataset.index);
        
        // Reordenar array de jogadores
        const draggedPlayer = players[draggedPlayerIndex];
        players.splice(draggedPlayerIndex, 1);
        players.splice(targetIndex, 0, draggedPlayer);
        
        // Re-renderizar lista
        renderPlayersList();
        
        // Persistir mudanças
        savePlayersOrder();
        
        // Mostrar notificação
        showRealTimeNotification('Ordem dos jogadores atualizada', 'success');
    }
    
    // Limpar classes de drag
    document.querySelectorAll('.player-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handlePlayerDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.player-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    draggedPlayerElement = null;
    draggedPlayerIndex = null;
}

async function savePlayersOrder() {
    try {
        // Atualizar ordem no servidor
        for (let i = 0; i < players.length; i++) {
            const player = { ...players[i], order: i };
            await api.updatePlayer(player.id, player);
        }
        
        // Salvar ordem no localStorage como backup
        const playersOrder = players.map(p => p.id);
        localStorage.setItem('playersOrder', JSON.stringify(playersOrder));
        
        console.log('Ordem dos jogadores salva com sucesso');
    } catch (error) {
        console.error('Erro ao salvar ordem dos jogadores:', error);
        showRealTimeNotification('Erro ao salvar ordem dos jogadores', 'error');
    }
}

// ===== ITEMS DRAG AND DROP =====

let draggedItemElement = null;
let draggedItemIndex = null;

function initializeItemDragAndDrop() {
    const itemCards = document.querySelectorAll('.item-card[draggable="true"]');
    
    itemCards.forEach(card => {
        card.addEventListener('dragstart', handleItemDragStart);
        card.addEventListener('dragover', handleItemDragOver);
        card.addEventListener('drop', handleItemDrop);
        card.addEventListener('dragend', handleItemDragEnd);
        card.addEventListener('dragenter', handleItemDragEnter);
        card.addEventListener('dragleave', handleItemDragLeave);
    });
}

function handleItemDragStart(e) {
    draggedItemElement = e.target;
    draggedItemIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleItemDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleItemDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('item-card') && e.target !== draggedItemElement) {
        e.target.classList.add('drag-over');
    }
}

function handleItemDragLeave(e) {
    if (e.target.classList.contains('item-card')) {
        e.target.classList.remove('drag-over');
    }
}

function handleItemDrop(e) {
    e.preventDefault();
    
    if (e.target.classList.contains('item-card') && e.target !== draggedItemElement) {
        const targetIndex = parseInt(e.target.dataset.index);
        
        // Reordenar array de itens
        const draggedItem = items[draggedItemIndex];
        items.splice(draggedItemIndex, 1);
        items.splice(targetIndex, 0, draggedItem);
        
        // Re-renderizar lista
        renderItemsList();
        
        // Persistir mudanças
        saveItemsOrder();
        
        // Mostrar notificação
        showRealTimeNotification('Ordem dos itens atualizada', 'success');
    }
    
    // Limpar classes de drag
    document.querySelectorAll('.item-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleItemDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.item-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    draggedItemElement = null;
    draggedItemIndex = null;
}

async function saveItemsOrder() {
    try {
        // Atualizar ordem no servidor
        for (let i = 0; i < items.length; i++) {
            const item = { ...items[i], order: i };
            await api.updateItem(item.id, item);
        }
        
        // Salvar ordem no localStorage como backup
        const itemsOrder = items.map(i => i.id);
        localStorage.setItem('itemsOrder', JSON.stringify(itemsOrder));
        
        console.log('Ordem dos itens salva com sucesso');
    } catch (error) {
        console.error('Erro ao salvar ordem dos itens:', error);
        showRealTimeNotification('Erro ao salvar ordem dos itens', 'error');
    }
}

// ===== PLAYERS MANAGEMENT =====

let players = [];
const playersApiUrl = '/api/players';

async function loadPlayers() {
    try {
        players = await api.getPlayers();
        renderPlayersList();
    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
    }
}

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function addPlayer() {
    const nickInput = document.getElementById('playerNick');
    const classInput = document.getElementById('playerClass');
    const levelInput = document.getElementById('playerLevel');
    const editingId = nickInput.dataset.editingId;
    
    const nick = nickInput.value.trim();
    if (!nick) {
        alert('Por favor, digite um nick válido.');
        return;
    }
    
    if (editingId) {
        // Modo edição
        const updatedPlayer = {
            id: editingId,
            nick: nick,
            class: classInput.value.trim(),
            level: parseInt(levelInput.value) || 1,
            createdAt: new Date().toISOString()
        };
        
        try {
            await api.updatePlayer(editingId, updatedPlayer);
            
            // Atualizar na lista local
            const index = players.findIndex(p => p.id === editingId);
            if (index !== -1) {
                players[index] = updatedPlayer;
            }
            
            // Limpar campos e resetar modo
            nickInput.value = '';
            classInput.value = '';
            levelInput.value = '';
            delete nickInput.dataset.editingId;
            
            const submitBtn = document.querySelector('#playerForm button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Adicionar Jogador';
            
            renderPlayersList();
            alert('Jogador atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            alert('Erro ao conectar com o servidor!');
        }
    } else {
        // Modo adição
        if (players.some(p => p.nick.toLowerCase() === nick.toLowerCase())) {
            alert('Este nick já está cadastrado!');
            return;
        }
        
        const newPlayer = {
            id: generateId(),
            nick: nick,
            class: classInput.value.trim(),
            level: parseInt(levelInput.value) || 1,
            createdAt: new Date().toISOString()
        };
        
        try {
            await api.createPlayer(newPlayer);
            
            players.push(newPlayer);
            nickInput.value = '';
            classInput.value = '';
            levelInput.value = '';
            renderPlayersList();
            updateDistributionSelects();
            alert('Jogador adicionado com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar jogador:', error);
            alert('Erro ao conectar com o servidor!');
        }
    }
}

async function editPlayer(id) {
    const player = players.find(p => p.id === id);
    if (player) {
        const nickInput = document.getElementById('playerNick');
        const classInput = document.getElementById('playerClass');
        const levelInput = document.getElementById('playerLevel');
        
        nickInput.value = player.nick;
        classInput.value = player.class || '';
        levelInput.value = player.level || 1;
        nickInput.dataset.editingId = id;
        
        const submitBtn = document.querySelector('#playerForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Atualizar Jogador';
        
        nickInput.focus();
    }
}

async function deletePlayer(id) {
    if (confirm('Tem certeza que deseja excluir este jogador?')) {
        try {
            await deletePlayerAPI(id);
            players = players.filter(p => p.id !== id);
            renderPlayersList();
            updateDistributionSelects();
            alert('Jogador excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir jogador:', error);
            alert('Erro ao excluir jogador');
        }
    }
}

async function deletePlayerAPI(id) {
    await api.deletePlayer(id);
}

function searchPlayers() {
    const searchTerm = document.getElementById('playerSearch').value.toLowerCase();
    const filteredPlayers = players.filter(player => 
        player.nick.toLowerCase().includes(searchTerm) ||
        (player.class && player.class.toLowerCase().includes(searchTerm))
    );
    renderPlayersList(filteredPlayers);
}

function renderPlayersList(playerList = players) {
    const playersList = document.getElementById('playersList');
    
    if (!playersList) return;
    
    if (playerList.length === 0) {
        playersList.innerHTML = '<p class="no-players">Nenhum jogador encontrado.</p>';
        return;
    }
    
    playersList.innerHTML = playerList.map((player, index) => {
        return `
            <div class="player-card" draggable="true" data-player-id="${player.id}" data-index="${index}">
                <div class="drag-handle">⋮⋮</div>
                <div class="player-info">
                    <div class="player-nick">${player.nick}</div>
                    <div class="player-details">
                        Classe: ${player.class || 'Não informada'} | 
                        Nível: ${player.level || 1}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="edit-btn" onclick="editPlayer('${player.id}')">
                        ✏️ Editar
                    </button>
                    <button class="delete-btn" onclick="deletePlayer('${player.id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Adicionar event listeners para drag and drop
    initializePlayerDragAndDrop();
}

// ===== ITEMS MANAGEMENT =====

let items = [];
const itemsApiUrl = '/api/items';

async function loadItems() {
    try {
        items = await api.getItems();
        renderItemsList();
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
    }
}

async function addItem() {
    const nameInput = document.getElementById('itemName');
    const descriptionInput = document.getElementById('itemDescription');
    const categoryInput = document.getElementById('itemCategory');
    const editingId = nameInput.dataset.editingId;
    
    const name = nameInput.value.trim();
    if (!name) {
        alert('Por favor, digite um nome válido.');
        return;
    }
    
    if (editingId) {
        // Modo edição
        const updatedItem = {
            id: editingId,
            name: name,
            description: descriptionInput.value.trim(),
            category: categoryInput.value,
            createdAt: new Date().toISOString()
        };
        
        try {
            await api.updateItem(editingId, updatedItem);
            
            // Atualizar na lista local
            const index = items.findIndex(i => i.id === editingId);
            if (index !== -1) {
                items[index] = updatedItem;
            }
            
            // Limpar campos e resetar modo
            nameInput.value = '';
            descriptionInput.value = '';
            categoryInput.value = '';
            delete nameInput.dataset.editingId;
            
            const submitBtn = document.querySelector('#itemForm button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Adicionar Item';
            
            renderItemsList();
            alert('Item atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            alert('Erro ao conectar com o servidor!');
        }
    } else {
        // Modo adição
        if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
            alert('Este item já está cadastrado!');
            return;
        }
        
        const newItem = {
            id: generateId(),
            name: name,
            description: descriptionInput.value.trim(),
            category: categoryInput.value,
            createdAt: new Date().toISOString()
        };
        
        try {
            await api.createItem(newItem);
            
            items.push(newItem);
            nameInput.value = '';
            descriptionInput.value = '';
            categoryInput.value = '';
            renderItemsList();
            updateDistributionSelects();
            alert('Item adicionado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            alert('Erro ao conectar com o servidor!');
        }
    }
}

// ===== SISTEMA DE TEMPO REAL =====

// Função para mostrar notificações em tempo real
function showRealTimeNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `real-time-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <span class="notification-time">${new Date().toLocaleTimeString('pt-BR')}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animação de entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Função para adicionar indicador de tempo real
function addRealTimeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'realTimeIndicator';
    indicator.className = 'real-time-indicator';
    indicator.innerHTML = `
        <div class="indicator-dot"></div>
        <span>Tempo Real</span>
    `;
    
    document.body.appendChild(indicator);
}

async function editItem(id) {
    const item = items.find(i => i.id === id);
    if (item) {
        const nameInput = document.getElementById('itemName');
        const descriptionInput = document.getElementById('itemDescription');
        const categoryInput = document.getElementById('itemCategory');
        
        nameInput.value = item.name;
        descriptionInput.value = item.description || '';
        categoryInput.value = item.category;
        nameInput.dataset.editingId = id;
        
        const submitBtn = document.querySelector('#itemForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Atualizar Item';
        
        nameInput.focus();
    }
}

async function deleteItem(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        try {
            await deleteItemAPI(id);
            items = items.filter(i => i.id !== id);
            renderItemsList();
            updateDistributionSelects();
            alert('Item excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            alert('Erro ao excluir item');
        }
    }
}

async function deleteItemAPI(id) {
    await api.deleteItem(id);
}

function searchItems() {
    const searchTerm = document.getElementById('itemSearch').value.toLowerCase();
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
        (item.category && item.category.toLowerCase().includes(searchTerm))
    );
    renderItemsList(filteredItems);
}

function renderItemsList(itemList = items) {
    const itemsList = document.getElementById('itemsList');
    
    if (!itemsList) return;
    
    if (itemList.length === 0) {
        itemsList.innerHTML = '<p class="no-players">Nenhum item encontrado.</p>';
        return;
    }
    
    itemsList.innerHTML = itemList.map((item, index) => {
        return `
            <div class="item-card" draggable="true" data-item-id="${item.id}" data-index="${index}">
                <div class="drag-handle">⋮⋮</div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        ${item.description ? `${item.description} | ` : ''}
                        Categoria: ${item.category}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="edit-btn" onclick="editItem('${item.id}')">
                        ✏️ Editar
                    </button>
                    <button class="delete-btn" onclick="deleteItem('${item.id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Adicionar event listeners para drag and drop
    initializeItemDragAndDrop();
}

// ===== DISTRIBUTION MANAGEMENT =====

let distributions = [];
const distributionApiUrl = '/api/distribution';

async function loadDistributions() {
    try {
        distributions = await api.getDistributions();
        renderDistributionHistory();
    } catch (error) {
        console.error('Erro ao carregar distribuições:', error);
    }
}

async function distributeItem() {
    const playerId = document.getElementById('distributionPlayer').value;
    const itemId = document.getElementById('distributionItem').value;
    const quantity = parseInt(document.getElementById('distributionQuantity').value) || 1;
    
    if (!playerId || !itemId || !quantity) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const newDistribution = {
        id: generateId(),
        playerId: playerId,
        itemId: itemId,
        quantity: quantity,
        createdAt: new Date().toISOString()
    };
    
    try {
        await api.createDistribution(newDistribution);
        
        distributions.push(newDistribution);
        
        // Resetar status de participação IMEDIATAMENTE após distribuição
        resetAllParticipationStatus();
        
        // Limpar formulário
        document.getElementById('distributionPlayer').value = '';
        document.getElementById('distributionItem').value = '';
        document.getElementById('distributionQuantity').value = '1';
        
        // Atualizar interface
        renderDistributionHistory();
        
        // Garantir que as sinalizações verdes sejam removidas
        setTimeout(() => {
            resetAllParticipationStatus();
        }, 500);
        
        alert('✅ Item distribuído com sucesso!\n🔄 Sinalizações verdes removidas para próxima distribuição.');
    } catch (error) {
        console.error('Erro ao distribuir item:', error);
        alert('Erro ao conectar com o servidor!');
    }
}

// Função para resetar status de participação de todos os jogadores
function resetAllParticipationStatus() {
    try {
        // Criar array com todas as chaves relacionadas à participação
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('participationStatus_') || key.startsWith('lastParticipation_'))) {
                keysToRemove.push(key);
            }
        }
        
        // Remover todas as chaves de participação
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Criar um timestamp global para sinalizar reset de participação
        const resetTimestamp = Date.now();
        localStorage.setItem('participationResetTimestamp', resetTimestamp.toString());
        
        // Forçar limpeza adicional de qualquer estado residual
        localStorage.removeItem('currentParticipationCount');
        
        console.log(`✅ Status de participação resetado para ${keysToRemove.length} chaves`);
        console.log('🔄 Sinalizações verdes removidas - nova distribuição iniciada');
        
        // Mostrar notificação visual
        showRealTimeNotification('Sinalizações verdes removidas', 'success');
        
        // Forçar atualização dos selects após reset
        setTimeout(() => {
            updateDistributionSelects();
        }, 100);
        
        // Atualizar estatísticas do dashboard
        setTimeout(() => {
            updateDashboardStats();
        }, 200);
        
    } catch (error) {
        console.error('❌ Erro ao resetar status de participação:', error);
        showRealTimeNotification('Erro ao remover sinalizações', 'error');
    }
}

function renderDistributionHistory() {
    const distributionTable = document.getElementById('distributionTable');
    if (!distributionTable) return;
    
    const thead = distributionTable.querySelector('thead tr');
    const tbody = distributionTable.querySelector('tbody');
    
    if (!thead || !tbody) return;
    
    // Limpar cabeçalhos extras (manter apenas "NICK")
    while (thead.children.length > 1) {
        thead.removeChild(thead.lastChild);
    }
    
    // Adicionar cabeçalhos dos itens
    items.forEach(item => {
        const th = document.createElement('th');
        th.textContent = item.name;
        th.style.textAlign = 'center';
        thead.appendChild(th);
    });
    
    // Criar mapa de distribuições
    const distributionMap = {};
    distributions.forEach(dist => {
        if (!distributionMap[dist.playerId]) {
            distributionMap[dist.playerId] = {};
        }
        if (!distributionMap[dist.playerId][dist.itemId]) {
            distributionMap[dist.playerId][dist.itemId] = 0;
        }
        distributionMap[dist.playerId][dist.itemId] += dist.quantity || 1;
    });
    
    // Renderizar linhas dos jogadores
    tbody.innerHTML = '';
    players.forEach(player => {
        const row = document.createElement('tr');
        
        // Verificar se o jogador participou hoje
        const lastParticipation = localStorage.getItem(`lastParticipation_${player.id}`);
        const hasParticipatedToday = checkIfParticipatedToday(lastParticipation);
        
        if (hasParticipatedToday) {
            row.classList.add('participated-today');
        }
        
        // Célula do nick
        const nickCell = document.createElement('td');
        nickCell.textContent = player.nick;
        nickCell.style.fontWeight = 'bold';
        row.appendChild(nickCell);
        
        // Células dos itens
        items.forEach(item => {
            const cell = document.createElement('td');
            const quantity = distributionMap[player.id] && distributionMap[player.id][item.id] 
                ? distributionMap[player.id][item.id] 
                : 0;
            
            if (quantity > 0) {
                cell.textContent = quantity;
                cell.style.textAlign = 'center';
            } else {
                cell.textContent = '-';
                cell.style.textAlign = 'center';
                cell.style.color = '#ccc';
            }
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
    
    if (players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; color: #666;">Nenhum jogador cadastrado</td></tr>';
    }
}

function checkIfParticipatedToday(lastParticipationString) {
    if (!lastParticipationString) return false;
    
    try {
        const lastParticipation = new Date(lastParticipationString);
        const today = new Date();
        
        // Verificar se é o mesmo dia (ano, mês e dia)
        const isSameDay = lastParticipation.getFullYear() === today.getFullYear() &&
                         lastParticipation.getMonth() === today.getMonth() &&
                         lastParticipation.getDate() === today.getDate();
        
        return isSameDay;
    } catch (error) {
        console.error('Erro ao verificar participação de hoje:', error);
        return false;
    }
}

function updateDistributionSelects() {
    const playerSelect = document.getElementById('distributionPlayer');
    const itemSelect = document.getElementById('distributionItem');
    
    if (playerSelect) {
        // Preservar seleção atual
        const currentPlayerSelection = playerSelect.value;
        
        playerSelect.innerHTML = '<option value="">Selecione um jogador</option>';
        
        // Filtrar apenas jogadores que marcaram "participar"
        const participatingPlayers = players.filter(player => {
            const participationStatus = localStorage.getItem(`participationStatus_${player.id}`);
            return participationStatus === 'participating';
        });
        
        if (participatingPlayers.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum jogador participando';
            option.disabled = true;
            playerSelect.appendChild(option);
        } else {
            participatingPlayers.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = `${player.nick} (${player.class || 'Sem classe'})`;
                playerSelect.appendChild(option);
            });
        }
        
        // Restaurar seleção se o jogador ainda estiver participando
        if (currentPlayerSelection && participatingPlayers.some(p => p.id === currentPlayerSelection)) {
            playerSelect.value = currentPlayerSelection;
        }
    }
    
    if (itemSelect) {
        // Preservar seleção atual
        const currentItemSelection = itemSelect.value;
        
        itemSelect.innerHTML = '<option value="">Selecione um item</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.category})`;
            itemSelect.appendChild(option);
        });
        
        // Restaurar seleção se o item ainda existir
        if (currentItemSelection && items.some(i => i.id === currentItemSelection)) {
            itemSelect.value = currentItemSelection;
        }
    }
}

// ===== MULTI DISTRIBUTION FUNCTIONS =====

let isMultiDistributionMode = false;
let selectedItems = new Map(); // Map to store selected items and their quantities

function toggleDistributionMode() {
    const singleCard = document.querySelector('.card.form-card:not(#multiDistributionCard)');
    const multiCard = document.getElementById('multiDistributionCard');
    
    isMultiDistributionMode = !isMultiDistributionMode;
    
    if (isMultiDistributionMode) {
        singleCard.style.display = 'none';
        multiCard.style.display = 'block';
        loadMultiDistributionItems();
        updateMultiDistributionSelects();
    } else {
        singleCard.style.display = 'block';
        multiCard.style.display = 'none';
        clearMultiDistributionForm();
    }
}

function loadMultiDistributionItems() {
    const container = document.getElementById('multiItemsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum item cadastrado</p>';
        return;
    }
    
    items.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'multi-item-row';
        itemRow.dataset.itemId = item.id;
        
        itemRow.innerHTML = `
            <input type="checkbox" class="multi-item-checkbox" id="item_${item.id}" 
                   onchange="toggleItemSelection('${item.id}')">
            <div class="multi-item-info">
                <div class="multi-item-name">${item.name}</div>
                <div class="multi-item-category">${item.category}</div>
            </div>
            <div class="multi-item-quantity">
                <label for="quantity_${item.id}">Qtd:</label>
                <input type="number" id="quantity_${item.id}" min="1" value="1" 
                       disabled onchange="updateItemQuantity('${item.id}', this.value)">
            </div>
        `;
        
        container.appendChild(itemRow);
    });
}

function toggleItemSelection(itemId) {
    const checkbox = document.getElementById(`item_${itemId}`);
    const quantityInput = document.getElementById(`quantity_${itemId}`);
    const itemRow = document.querySelector(`[data-item-id="${itemId}"]`);
    
    if (checkbox.checked) {
        // Item selected
        quantityInput.disabled = false;
        itemRow.classList.add('selected');
        selectedItems.set(itemId, parseInt(quantityInput.value) || 1);
    } else {
        // Item deselected
        quantityInput.disabled = true;
        itemRow.classList.remove('selected');
        selectedItems.delete(itemId);
    }
    
    updateMultiDistributionSummary();
    updateMultiDistributeButton();
}

function updateItemQuantity(itemId, quantity) {
    const qty = parseInt(quantity) || 1;
    if (selectedItems.has(itemId)) {
        selectedItems.set(itemId, qty);
        updateMultiDistributionSummary();
    }
}

function updateMultiDistributionSummary() {
    const summaryDiv = document.getElementById('multiDistributionSummary');
    const summaryContent = document.getElementById('summaryContent');
    
    if (selectedItems.size === 0) {
        summaryDiv.style.display = 'none';
        return;
    }
    
    summaryDiv.style.display = 'block';
    summaryContent.innerHTML = '';
    
    selectedItems.forEach((quantity, itemId) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';
            summaryItem.innerHTML = `
                <span class="summary-item-name">${item.name}</span>
                <span class="summary-item-quantity">${quantity}x</span>
            `;
            summaryContent.appendChild(summaryItem);
        }
    });
}

function updateMultiDistributeButton() {
    const button = document.getElementById('multiDistributeBtn');
    const playerSelect = document.getElementById('multiDistributionPlayer');
    
    const hasSelectedItems = selectedItems.size > 0;
    const hasSelectedPlayer = playerSelect && playerSelect.value;
    
    button.disabled = !(hasSelectedItems && hasSelectedPlayer);
}

function updateMultiDistributionSelects() {
    const playerSelect = document.getElementById('multiDistributionPlayer');
    
    if (playerSelect) {
        // Copy options from single distribution select
        const singlePlayerSelect = document.getElementById('distributionPlayer');
        playerSelect.innerHTML = singlePlayerSelect.innerHTML;
        
        // Add event listener to update button state
        playerSelect.addEventListener('change', updateMultiDistributeButton);
    }
}

function clearMultiDistributionForm() {
    selectedItems.clear();
    
    // Clear all checkboxes and reset quantities
    document.querySelectorAll('.multi-item-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.querySelectorAll('.multi-item-quantity input').forEach(input => {
        input.value = '1';
        input.disabled = true;
    });
    
    document.querySelectorAll('.multi-item-row').forEach(row => {
        row.classList.remove('selected');
    });
    
    // Clear form fields
    const playerSelect = document.getElementById('multiDistributionPlayer');
    const reasonSelect = document.getElementById('multiDistributionReason');
    
    if (playerSelect) playerSelect.value = '';
    if (reasonSelect) reasonSelect.value = '';
    
    // Hide summary and disable button
    document.getElementById('multiDistributionSummary').style.display = 'none';
    document.getElementById('multiDistributeBtn').disabled = true;
}

async function distributeMultipleItems() {
    const playerId = document.getElementById('multiDistributionPlayer').value;
    const reason = document.getElementById('multiDistributionReason').value;
    
    if (!playerId || selectedItems.size === 0) {
        alert('Por favor, selecione um jogador e pelo menos um item.');
        return;
    }
    
    const player = players.find(p => p.id === playerId);
    if (!player) {
        alert('Jogador não encontrado.');
        return;
    }
    
    try {
        const distributionPromises = [];
        const distributionSummary = [];
        
        // Create distribution for each selected item
        selectedItems.forEach((quantity, itemId) => {
            const item = items.find(i => i.id === itemId);
            if (item) {
                const newDistribution = {
                    id: generateId(),
                    playerId: playerId,
                    itemId: itemId,
                    quantity: quantity,
                    reason: reason,
                    createdAt: new Date().toISOString()
                };
                
                distributionPromises.push(api.createDistribution(newDistribution));
                distributions.push(newDistribution);
                distributionSummary.push(`${item.name}: ${quantity}x`);
            }
        });
        
        // Execute all distributions
        await Promise.all(distributionPromises);
        
        // Reset participation status
        resetAllParticipationStatus();
        
        // Clear form and update interface
        clearMultiDistributionForm();
        renderDistributionHistory();
        
        // Show success message
        const itemCount = selectedItems.size;
        const totalQuantity = Array.from(selectedItems.values()).reduce((sum, qty) => sum + qty, 0);
        
        alert(`✅ Distribuição múltipla realizada com sucesso!\n` +
              `👤 Jogador: ${player.nick}\n` +
              `📦 ${itemCount} tipos de itens distribuídos\n` +
              `🔢 Total: ${totalQuantity} itens\n` +
              `📋 Itens: ${distributionSummary.join(', ')}\n\n` +
              `🔄 Sinalizações verdes removidas para próxima distribuição.`);
        
        // Ensure participation status is reset
        setTimeout(() => {
            resetAllParticipationStatus();
        }, 500);
        
    } catch (error) {
        console.error('Erro ao distribuir itens:', error);
        alert('Erro ao conectar com o servidor!');
    }
}

// ===== RESET FUNCTIONS =====

async function resetPlayers() {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os jogadores cadastrados!\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja continuar?')) {
        return;
    }
    
    try {
        // Buscar todos os jogadores
        const allPlayers = await api.getPlayers();
        
        // Deletar cada jogador
        for (const player of allPlayers) {
            await api.deletePlayer(player.id);
        }
        
        // Limpar array local e re-renderizar
        players = [];
        renderPlayersList();
        updateDistributionSelects();
        renderDistributionHistory();
        updateDashboardStats();
        
        alert('✅ Todos os jogadores foram removidos com sucesso!');
    } catch (error) {
        console.error('Erro ao resetar jogadores:', error);
        alert('❌ Erro ao resetar jogadores. Tente novamente.');
    }
}

async function resetItems() {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os itens cadastrados!\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja continuar?')) {
        return;
    }
    
    try {
        // Buscar todos os itens
        const allItems = await api.getItems();
        
        // Deletar cada item
        for (const item of allItems) {
            await api.deleteItem(item.id);
        }
        
        // Limpar array local e re-renderizar
        items = [];
        renderItemsList();
        updateDistributionSelects();
        renderDistributionHistory();
        updateDashboardStats();
        
        alert('✅ Todos os itens foram removidos com sucesso!');
    } catch (error) {
        console.error('Erro ao resetar itens:', error);
        alert('❌ Erro ao resetar itens. Tente novamente.');
    }
}

async function resetDistributions() {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODO o histórico de distribuição!\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja continuar?')) {
        return;
    }
    
    try {
        // Buscar todas as distribuições
        const allDistributions = await api.getDistributions();
        
        // Deletar cada distribuição
        for (const distribution of allDistributions) {
            await api.deleteDistribution(distribution.id);
        }
        
        // Limpar array local e re-renderizar
        distributions = [];
        renderDistributionHistory();
        updateDashboardStats();
        
        alert('✅ Todo o histórico de distribuição foi removido com sucesso!');
    } catch (error) {
        console.error('Erro ao resetar distribuições:', error);
        alert('❌ Erro ao resetar distribuições. Tente novamente.');
    }
}

async function resetAll() {
    if (!confirm('🚨 ATENÇÃO MÁXIMA: Esta ação irá apagar TODOS OS DADOS do sistema!\n\n• Todos os jogadores\n• Todos os itens\n• Todo o histórico de distribuição\n\nEsta ação é COMPLETAMENTE IRREVERSÍVEL!\n\nTem ABSOLUTA CERTEZA que deseja continuar?')) {
        return;
    }
    
    if (!confirm('🚨 ÚLTIMA CONFIRMAÇÃO:\n\nVocê está prestes a DESTRUIR TODOS OS DADOS!\n\nEsta é sua última chance de cancelar.\n\nConfirma o RESET COMPLETO?')) {
        return;
    }
    
    try {
        // Reset jogadores
        const allPlayers = await api.getPlayers();
        for (const player of allPlayers) {
            await api.deletePlayer(player.id);
        }
        
        // Reset itens
        const allItems = await api.getItems();
        for (const item of allItems) {
            await api.deleteItem(item.id);
        }
        
        // Reset distribuições
        const allDistributions = await api.getDistributions();
        for (const distribution of allDistributions) {
            await api.deleteDistribution(distribution.id);
        }
        
        // Limpar arrays locais e re-renderizar tudo
        players = [];
        items = [];
        distributions = [];
        
        renderPlayersList();
        renderItemsList();
        renderDistributionHistory();
        updateDistributionSelects();
        updateDashboardStats();
        
        alert('🔥 RESET COMPLETO REALIZADO!\n\nTodos os dados foram removidos do sistema.');
    } catch (error) {
        console.error('Erro ao resetar sistema:', error);
        alert('❌ Erro durante o reset. Alguns dados podem não ter sido removidos.');
    }
}

// ===== NAVIGATION =====

function toggleNavigation() {
    const nav = document.querySelector('.admin-nav');
    const main = document.querySelector('.admin-main');
    
    if (!nav || !main) return;
    
    if (nav.classList.contains('minimized')) {
        nav.classList.remove('minimized');
        main.classList.remove('nav-minimized');
    } else {
        nav.classList.add('minimized');
        main.classList.add('nav-minimized');
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const userType = sessionStorage.getItem('userType');
    if (userType !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    // Definir nome do admin
    if (document.getElementById('adminName')) {
        document.getElementById('adminName').textContent = 'Administrador';
    }
    
    // Carregar dados iniciais
    await loadPlayers();
    await loadItems();
    await loadDistributions();
    
    // Atualizar selects e stats
    updateDistributionSelects();
    await updateDashboardStats();
    
    // Sistema de atualização em tempo real
    let lastUpdateTime = Date.now();
    
    // Atualizar dados a cada 10 segundos para tempo real
    setInterval(async () => {
        const currentTime = Date.now();
        
        // Verificar se houve mudanças
        const previousPlayersCount = players.length;
        const previousItemsCount = items.length;
        const previousDistributionsCount = distributions.length;
        const previousParticipations = countParticipationsToday();
        
        await loadPlayers();
        await loadItems();
        await loadDistributions();
        
        const newParticipations = countParticipationsToday();
        
        // Detectar mudanças e mostrar notificações
        if (players.length !== previousPlayersCount) {
            showRealTimeNotification('Jogadores atualizados', 'info');
        }
        if (items.length !== previousItemsCount) {
            showRealTimeNotification('Itens atualizados', 'info');
        }
        if (distributions.length !== previousDistributionsCount) {
            showRealTimeNotification('Nova distribuição registrada', 'success');
        }
        if (newParticipations !== previousParticipations) {
            showRealTimeNotification(`Participações: ${newParticipations}`, 'success');
        }
        
        await updateDashboardStats();
        renderDistributionHistory();
        
        // Atualizar selects de distribuição em tempo real
        updateDistributionSelects();
        
        // Atualizar modal se estiver aberto
        const participationModal = document.getElementById('participationModal');
        if (participationModal && participationModal.style.display === 'block') {
            loadParticipationsToday();
        }
        
        lastUpdateTime = currentTime;
    }, 10000);
    
    // Adicionar indicador de tempo real
    addRealTimeIndicator();
    
    // Preencher selects de distribuição
    updateDistributionSelects();
    
    // Event listeners para busca
    const playerSearch = document.getElementById('playerSearch');
    if (playerSearch) {
        playerSearch.addEventListener('input', searchPlayers);
    }
    
    const itemSearch = document.getElementById('itemSearch');
    if (itemSearch) {
        itemSearch.addEventListener('input', searchItems);
    }
    
    // Event listeners para formulários
    const distributionForm = document.getElementById('distributionForm');
    if (distributionForm) {
        distributionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            distributeItem();
        });
    }
    
    const playerForm = document.getElementById('playerForm');
    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addPlayer();
        });
    }
    
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addItem();
        });
    }
    
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (currentEditType === 'player') {
                await savePlayerEdit();
            } else if (currentEditType === 'item') {
                await saveItemEdit();
            }
        });
    }
    
    // Event listeners para modais
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                closeEditModal();
            }
        });
    }
    
    // Event listeners para modal de participações
    const participationModal = document.getElementById('participationModal');
    if (participationModal) {
        participationModal.addEventListener('click', (e) => {
            if (e.target.id === 'participationModal') {
                closeParticipationModal();
            }
        });
    }
    
    // Event listener para tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (editModal && editModal.style.display === 'flex') {
                closeEditModal();
            }
            if (onlineModal && onlineModal.style.display === 'block') {
                closeParticipationModal();
            }
        }
    });
    
    // Event listeners para navegação
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            if (section) switchToSection(section);
        });
    });
    
    // Event listener para logout
    if (document.getElementById('logoutBtn')) {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }
    
    // Event listener para toggle de navegação
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', toggleNavigation);
    }
});

function openParticipationModal() {
    const modal = document.getElementById('participationModal');
    if (modal) {
        modal.style.display = 'block';
        loadParticipationsToday();
    }
}

function closeParticipationModal() {
    const modal = document.getElementById('participationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function loadParticipationsToday() {
    const container = document.getElementById('participationsList');
    if (!container) return;
    
    try {
        // Buscar todos os jogadores
        const allPlayers = await api.getPlayers();
        
        // Filtrar jogadores que participaram hoje
        const participatedPlayers = allPlayers.filter(player => {
            const lastParticipation = localStorage.getItem(`lastParticipation_${player.id}`);
            return checkIfParticipatedToday(lastParticipation);
        });
        
        if (participatedPlayers.length === 0) {
            container.innerHTML = `
                <div class="no-participations">
                    <div class="empty-state">
                        <div class="empty-icon">🎯</div>
                        <h3>Nenhuma participação hoje</h3>
                        <p>Ainda não há jogadores que confirmaram participação hoje.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Renderizar lista de participações
        container.innerHTML = participatedPlayers.map(player => {
            const lastParticipation = localStorage.getItem(`lastParticipation_${player.id}`);
            const participationTime = lastParticipation ? new Date(lastParticipation).toLocaleTimeString('pt-BR') : 'N/A';
            const totalParticipations = localStorage.getItem(`participations_${player.id}`) || '0';
            
            return `
                <div class="participation-item">
                    <div class="player-avatar">
                        <div class="avatar-circle">${player.nick.charAt(0).toUpperCase()}</div>
                        <div class="participation-indicator"></div>
                    </div>
                    <div class="player-info">
                        <div class="player-name">${player.nick}</div>
                        <div class="player-details">${player.class || 'Sem classe'} • Nível ${player.level || 1}</div>
                    </div>
                    <div class="participation-stats">
                        <div class="participation-time">${participationTime}</div>
                        <div class="participation-count">${totalParticipations} participações</div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar participações:', error);
        container.innerHTML = `
            <div class="no-participations">
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Erro ao carregar</h3>
                    <p>Não foi possível carregar as participações.</p>
                </div>
            </div>
        `;
    }
}

function switchToSection(sectionName) {
    // Remover classe active de todas as seções
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Ativar seção selecionada
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Ativar botão correspondente
    const targetBtn = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    console.log(`Switched to section: ${sectionName}`);
}

// ===== EDIT MODAL FUNCTIONS =====

let currentEditType = null;
let currentEditId = null;

function openEditPlayerModal(player) {
    currentEditType = 'player';
    currentEditId = player.id;
    
    document.getElementById('editPlayerNick').value = player.nick;
    document.getElementById('editPlayerClass').value = player.class || '';
    document.getElementById('editPlayerLevel').value = player.level || 1;
    
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const playerFields = document.getElementById('editPlayerFields');
    const itemFields = document.getElementById('editItemFields');
    
    title.textContent = `Editar Jogador: ${player.nick}`;
    playerFields.style.display = 'block';
    itemFields.style.display = 'none';
    modal.style.display = 'flex';
    
    document.getElementById('editPlayerNick').focus();
}

function openEditItemModal(item) {
    currentEditType = 'item';
    currentEditId = item.id;
    
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemDescription').value = item.description || '';
    document.getElementById('editItemCategory').value = item.category;
    
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const playerFields = document.getElementById('editPlayerFields');
    const itemFields = document.getElementById('editItemFields');
    
    title.textContent = `Editar Item: ${item.name}`;
    playerFields.style.display = 'none';
    itemFields.style.display = 'block';
    modal.style.display = 'flex';
    
    document.getElementById('editItemName').focus();
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    currentEditType = null;
    currentEditId = null;
}

async function savePlayerEdit() {
    const nick = document.getElementById('editPlayerNick').value.trim();
    const playerClass = document.getElementById('editPlayerClass').value.trim();
    const level = parseInt(document.getElementById('editPlayerLevel').value) || 1;
    
    if (!nick) {
        alert('Por favor, digite um nick válido.');
        return;
    }
    
    try {
        await api.updatePlayer(currentEditId, {
            id: currentEditId,
            nick: nick,
            class: playerClass,
            level: level,
            createdAt: new Date().toISOString()
        });
        
        await loadPlayers();
        updateDistributionSelects();
        renderDistributionHistory();
        closeEditModal();
        alert('Jogador atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar jogador:', error);
        alert('Erro ao atualizar jogador. Tente novamente.');
    }
}

async function saveItemEdit() {
    const name = document.getElementById('editItemName').value.trim();
    const description = document.getElementById('editItemDescription').value.trim();
    const category = document.getElementById('editItemCategory').value;
    
    if (!name) {
        alert('Por favor, digite um nome válido.');
        return;
    }
    
    try {
        await api.updateItem(currentEditId, {
            id: currentEditId,
            name: name,
            description: description,
            category: category,
            createdAt: new Date().toISOString()
        });
        
        await loadItems();
        updateDistributionSelects();
        renderDistributionHistory();
        closeEditModal();
        alert('Item atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar item:', error);
        alert('Erro ao atualizar item. Tente novamente.');
    }
}