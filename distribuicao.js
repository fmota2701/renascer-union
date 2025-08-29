class DistributionManager {
    constructor() {
        this.players = [];
        this.items = [];
        this.distribution = [];
        this.selectedItemId = null;
        this.selectedItemIds = new Set(); // Para distribuição múltipla
        this.distributionData = {};
        this.playersApiUrl = '/api/players';
        this.itemsApiUrl = '/api/items';
        this.distributionApiUrl = '/api/distribution';
        this.init();
    }

    async init() {
        // Inicialização básica
        await this.loadData();
        this.populateItemSelector();
        this.populateMultipleItemsSelector();
        this.setupEventListeners();
        this.renderTable();
        
        // Sistema de atualização em tempo real
        this.lastUpdateTime = Date.now();
        this.addRealTimeIndicator();
        
        setInterval(async () => {
            const previousPlayersCount = this.players.length;
            const previousItemsCount = this.items.length;
            const previousDistributionCount = this.distribution.length;
            
            await this.refreshData();
            
            // Detectar mudanças e mostrar notificações
            if (this.players.length !== previousPlayersCount) {
                this.showRealTimeNotification('Lista de jogadores atualizada', 'info');
            }
            if (this.items.length !== previousItemsCount) {
                this.showRealTimeNotification('Lista de itens atualizada', 'info');
            }
            if (this.distribution.length !== previousDistributionCount) {
                this.showRealTimeNotification('Nova distribuição detectada', 'success');
                this.renderTable(); // Re-renderizar tabela quando houver nova distribuição
            }
            
            this.lastUpdateTime = Date.now();
        }, 8000);
    }

    async loadData() {
        // Carrega dados dos jogadores e itens da API
        try {
            // Carregar jogadores da API
            this.players = await api.getPlayers();
            
            // Carregar itens da API
            this.items = await api.getItems();
            
            // Carrega distribuição da API
            this.distribution = await api.getDistributions();
            
            // Manter distributionData no localStorage por enquanto
            this.distributionData = JSON.parse(localStorage.getItem('distributionData')) || {};
        } catch (error) {
            console.error('Erro ao conectar com a API:', error);
            this.players = [];
            this.items = [];
            this.distributionData = {};
        }
    }

    setupEventListeners() {
        // Event listeners para os botões
        const refreshBtn = document.getElementById('refreshDistribution');
        const exportBtn = document.getElementById('exportDistribution');
        const itemSelect = document.getElementById('itemSelect');
        const distributeBtn = document.getElementById('distributeItem');
        
        // Event listeners para distribuição múltipla
        const selectAllBtn = document.getElementById('selectAllItems');
        const clearAllBtn = document.getElementById('clearAllItems');
        const distributeMultipleBtn = document.getElementById('distributeMultiple');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.manualRefresh();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        if (itemSelect) {
            itemSelect.addEventListener('change', (e) => this.onItemSelect(e));
        }
        
        if (distributeBtn) {
            distributeBtn.addEventListener('click', () => this.distributeSelectedItem());
        }
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllItems());
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllItems());
        }
        
        if (distributeMultipleBtn) {
            distributeMultipleBtn.addEventListener('click', () => this.distributeMultipleItems());
        }

        // Adiciona listener para cliques nas células da tabela
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('distribute-cell')) {
                const itemId = e.target.dataset.itemId;
                const playerId = e.target.dataset.playerId;
                this.distributeItemToPlayer(itemId, playerId);
            }
        });
        
        // Listener para mudanças nos checkboxes de itens múltiplos
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox-input')) {
                this.onMultipleItemChange(e);
            }
        });
    }

    async refreshData() {
        // Método para atualizar dados automaticamente (sem mensagem)
        await this.loadData();
        this.populateItemSelector();
        this.renderTable();
    }

    async manualRefresh() {
        // Método para atualizar dados manualmente (com mensagem)
        await this.loadData();
        this.populateItemSelector();
        this.populateMultipleItemsSelector();
        this.renderTable();
        this.showMessage('Dados atualizados com sucesso!', 'success');
    }

    populateItemSelector() {
        const itemSelect = document.getElementById('itemSelect');
        if (!itemSelect) return;
        
        // Limpa opções existentes (exceto a primeira)
        itemSelect.innerHTML = '<option value="">Escolha um item...</option>';
        
        // Adiciona cada item como opção
        this.items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.category})`;
            itemSelect.appendChild(option);
        });
    }

    populateMultipleItemsSelector() {
        const container = document.getElementById('multipleItemsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        this.items.forEach(item => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'item-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `item-${item.id}`;
            checkbox.value = item.id;
            checkbox.className = 'item-checkbox-input';
            
            const label = document.createElement('label');
            label.htmlFor = `item-${item.id}`;
            label.textContent = item.name;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            container.appendChild(checkboxDiv);
        });
    }
    
    onItemSelect(event) {
        const selectedValue = event.target.value;
        const distributeBtn = document.getElementById('distributeItem');
        
        this.selectedItemId = selectedValue || null;
        
        if (distributeBtn) {
            distributeBtn.disabled = !selectedValue;
        }
        
        // Atualiza a tabela para mostrar o estado atual da distribuição
        this.renderTable();
    }

    onMultipleItemChange(event) {
        const itemId = event.target.value;
        if (event.target.checked) {
            this.selectedItemIds.add(itemId);
        } else {
            this.selectedItemIds.delete(itemId);
        }
        this.updateMultipleDistributionButton();
    }

    selectAllItems() {
        const checkboxes = document.querySelectorAll('.item-checkbox-input');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.selectedItemIds.add(checkbox.value);
        });
        this.updateMultipleDistributionButton();
    }

    clearAllItems() {
        const checkboxes = document.querySelectorAll('.item-checkbox-input');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.selectedItemIds.clear();
        this.updateMultipleDistributionButton();
    }

    updateMultipleDistributionButton() {
        const distributeBtn = document.getElementById('distributeMultiple');
        if (distributeBtn) {
            distributeBtn.disabled = this.selectedItemIds.size === 0;
        }
    }
    
    async distributeSelectedItem() {
        if (!this.selectedItemId) return;
        
        const selectedItem = this.items.find(item => item.id === this.selectedItemId);
        if (!selectedItem) return;
        
        // Encontra o próximo jogador na sequência que ainda não recebeu este item
        const nextPlayer = this.getNextPlayerForDistribution(this.selectedItemId);
        
        if (!nextPlayer) {
            this.showMessage('Todos os jogadores já receberam este item!', 'warning');
            return;
        }
        
        try {
            // Cria registro de distribuição
            const distributionRecord = {
                id: `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                playerId: nextPlayer.id,
                itemId: this.selectedItemId,
                quantity: 1,
                distributedAt: new Date().toISOString()
            };
            
            // Salva na API
            await api.createDistribution(distributionRecord);
            
            // Atualiza dados locais
            this.distribution.push(distributionRecord);
            
            // Re-renderiza a tabela
            this.renderTable();
            
            this.showMessage(`Item "${selectedItem.name}" distribuído para ${nextPlayer.nick}!`, 'success');
        } catch (error) {
            console.error('Erro ao distribuir item:', error);
            this.showMessage('Erro ao distribuir item. Tente novamente.', 'error');
        }
    }
    
    getNextPlayerForDistribution(itemId) {
        // Verifica quais jogadores já receberam este item
        const playersWithItem = this.distribution
            .filter(dist => dist.itemId === itemId)
            .map(dist => dist.playerId);
        
        // Filtra jogadores que ainda não receberam o item
        const availablePlayers = this.players.filter(player => !playersWithItem.includes(player.id));
        
        // Prioriza jogadores com participação confirmada (lista verde)
        const participatingPlayers = availablePlayers.filter(player => {
            const participationStatus = localStorage.getItem(`participationStatus_${player.id}`);
            return participationStatus === 'participating';
        });
        
        // Se há jogadores participando, retorna o primeiro na ordem
        if (participatingPlayers.length > 0) {
            return participatingPlayers[0];
        }
        
        // Se não há jogadores participando, retorna o primeiro disponível na ordem
        return availablePlayers[0] || null;
    }
    
    hasPlayerReceivedItem(playerId, itemId) {
         return this.distribution.some(dist => 
             dist.playerId === playerId && dist.itemId === itemId
         );
     }
     
     async distributeItemToPlayer(itemId, playerId) {
         const selectedItem = this.items.find(item => item.id === itemId);
         const selectedPlayer = this.players.find(player => player.id === playerId);
         
         if (!selectedItem || !selectedPlayer) return;
         
         // Verifica se o jogador já recebeu este item
         if (this.hasPlayerReceivedItem(playerId, itemId)) {
             this.showMessage('Este jogador já recebeu este item!', 'warning');
             return;
         }
         
         try {
             // Cria registro de distribuição
             const distributionRecord = {
                 id: `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                 playerId: playerId,
                 itemId: itemId,
                 quantity: 1,
                 distributedAt: new Date().toISOString()
             };
             
             // Salva na API
            await api.createDistribution(distributionRecord);
            
            // Atualiza dados locais
            this.distribution.push(distributionRecord);
            
            // Re-renderiza a tabela
            this.renderTable();
            
            this.showMessage(`Item "${selectedItem.name}" distribuído para ${selectedPlayer.nick}!`, 'success');
         } catch (error) {
             console.error('Erro ao distribuir item:', error);
             this.showMessage('Erro ao distribuir item. Tente novamente.', 'error');
         }
     }

    async distributeMultipleItems() {
        if (this.selectedItemIds.size === 0) {
            this.showMessage('Selecione pelo menos um item para distribuir.', 'warning');
            return;
        }

        try {
            const itemsToDistribute = Array.from(this.selectedItemIds);
            const distributionResults = [];
            
            // Ordena os itens pela ordem que aparecem na lista
            const sortedItems = itemsToDistribute.sort((a, b) => {
                const itemA = this.items.find(item => item.id === a);
                const itemB = this.items.find(item => item.id === b);
                return this.items.indexOf(itemA) - this.items.indexOf(itemB);
            });

            for (const itemId of sortedItems) {
                const nextPlayer = this.getNextPlayerForDistribution(itemId);
                
                if (!nextPlayer) {
                    console.warn(`Nenhum jogador disponível para o item ${itemId}`);
                    continue;
                }

                const distributionRecord = {
                    id: `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    playerId: nextPlayer.id,
                    itemId: itemId,
                    quantity: 1,
                    distributedAt: new Date().toISOString()
                };

                try {
                    // Salva na API
                    await api.createDistribution(distributionRecord);
                    
                    this.distribution.push(distributionRecord);
                    distributionResults.push({
                        item: this.items.find(i => i.id === itemId)?.name,
                        player: nextPlayer.nick,
                        success: true
                    });
                } catch (error) {
                    console.error('Erro ao salvar distribuição:', error);
                    distributionResults.push({
                        item: this.items.find(i => i.id === itemId)?.name,
                        player: nextPlayer.nick,
                        success: false
                    });
                }
            }

            // Atualiza a exibição
            this.renderTable();
            
            // Limpa a seleção
            this.clearAllItems();
            
            // Mostra resultado
            const successCount = distributionResults.filter(r => r.success).length;
            const totalCount = distributionResults.length;
            
            if (successCount === totalCount) {
                this.showMessage(`Distribuição múltipla concluída com sucesso! ${successCount} itens distribuídos.`, 'success');
            } else {
                this.showMessage(`Distribuição parcialmente concluída. ${successCount}/${totalCount} itens distribuídos com sucesso.`, 'warning');
            }
            
        } catch (error) {
            console.error('Erro ao distribuir múltiplos itens:', error);
            this.showMessage('Erro ao distribuir múltiplos itens. Tente novamente.', 'error');
        }
    }
    
    exportData() {
         this.showMessage('Funcionalidade de exportação em desenvolvimento', 'info');
     }

    renderTable() {
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');
        const noDataMessage = document.getElementById('noDataMessage');

        if (!tableHeader || !tableBody || !noDataMessage) {
            console.error('Elementos da tabela não encontrados');
            return;
        }

        // Verifica se há dados para exibir
        if (this.players.length === 0 || this.items.length === 0) {
            tableHeader.style.display = 'none';
            tableBody.style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }

        // Mostra a tabela e esconde a mensagem
        tableHeader.style.display = '';
        tableBody.style.display = '';
        noDataMessage.style.display = 'none';

        // Renderiza o cabeçalho da tabela
        this.renderTableHeader();
        
        // Renderiza o corpo da tabela
        this.renderTableBody();
    }

    renderTableHeader() {
        const tableHeader = document.getElementById('tableHeader');
        
        // Limpa o cabeçalho existente
        tableHeader.innerHTML = '<th class="player-column">NICK</th>';
        
        // Adiciona uma coluna para cada item
        this.items.forEach(item => {
            const th = document.createElement('th');
            th.className = 'item-column';
            th.textContent = item.name;
            th.title = `${item.name} - ${item.category}`;
            tableHeader.appendChild(th);
        });
    }

    renderTableBody() {
        const tableBody = document.getElementById('tableBody');
        
        // Limpa o corpo da tabela
        tableBody.innerHTML = '';
        
        // Adiciona uma linha para cada jogador
        this.players.forEach(player => {
            const row = document.createElement('tr');
            
            // Célula do jogador
            const playerCell = document.createElement('td');
            playerCell.className = 'player-cell';
            playerCell.textContent = player.nick;
            row.appendChild(playerCell);
            
            // Célula para cada item
            this.items.forEach(item => {
                const itemCell = document.createElement('td');
                itemCell.className = 'item-cell';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                
                // Verifica se o jogador já recebeu este item
                const hasReceived = this.hasPlayerReceivedItem(player.id, item.id);
                checkbox.checked = hasReceived;
                
                // Se um item está selecionado para distribuição, habilita interação
                if (this.selectedItemId === item.id && !hasReceived) {
                    checkbox.disabled = false;
                    checkbox.title = `Clique para distribuir ${item.name} para ${player.nick}`;
                    checkbox.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            this.distributeItemToPlayer(item.id, player.id);
                        }
                    });
                } else {
                    checkbox.disabled = true;
                    if (hasReceived) {
                        checkbox.title = `${player.nick} já recebeu ${item.name}`;
                    } else {
                        checkbox.title = 'Selecione um item para distribuição';
                    }
                }
                
                itemCell.appendChild(checkbox);
                row.appendChild(itemCell);
            });
            
            tableBody.appendChild(row);
        });
    }

    showMessage(message, type = 'info') {
        // Cria e exibe uma mensagem temporária
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Adiciona a mensagem ao topo da seção
        const section = document.querySelector('.distribution-section');
        if (section) {
            section.insertBefore(messageDiv, section.firstChild);
            
            // Remove a mensagem após 3 segundos
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 3000);
        }
    }
    
    // ===== SISTEMA DE TEMPO REAL =====
    
    // Função para mostrar notificações em tempo real
    showRealTimeNotification(message, type = 'info') {
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
    addRealTimeIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'realTimeIndicator';
        indicator.className = 'real-time-indicator';
        indicator.innerHTML = `
            <div class="indicator-dot"></div>
            <span>Tempo Real</span>
        `;
        
        document.body.appendChild(indicator);
    }
}

// Inicializa o gerenciador quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    window.distributionManager = new DistributionManager();
});