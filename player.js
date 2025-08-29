class PlayerPanel {
    constructor() {
        this.playerId = 123;
        this.playerName = 'Jogador Atual';
        this.currentSection = 'dashboard';
        this.participationStatus = false;
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadPlayerData();
        this.checkParticipationStatus();
        this.updateLiveDistribution();
        
        // Update distribution every 10 seconds
        setInterval(() => {
            this.updateLiveDistribution();
        }, 10000);
    }

    checkAuth() {
        const userType = sessionStorage.getItem('userType');
        const playerId = sessionStorage.getItem('playerId');
        const userName = sessionStorage.getItem('userName');
        
        if (!userType || userType !== 'player') {
            window.location.href = 'login.html';
            return;
        }
        
        this.playerId = playerId || 123;
        this.playerName = userName || 'Jogador Atual';
    }

    bindEvents() {
        const participateBtn = document.getElementById('participateBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (participateBtn) {
            participateBtn.addEventListener('click', () => this.handleParticipation());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        }
    }

    switchToSection(sectionName) {
        this.currentSection = sectionName;
    }

    async loadPlayerData() {
        try {
            // Simulate player data loading
            console.log('Dados do jogador carregados');
            await this.updateDashboardStats();
        } catch (error) {
            console.error('Erro ao carregar dados do jogador:', error);
        }
    }

    async updateDashboardStats() {
        try {
            const response = await fetch('http://localhost:3001/items');
            const items = await response.json();
            
            const participantsResponse = await fetch('http://localhost:3001/participants');
            const participants = await participantsResponse.json();
            
            // Update total items
            const totalItemsElement = document.getElementById('playerTotalItems');
            if (totalItemsElement) {
                totalItemsElement.textContent = items.length;
            }
            
            // Update total participants
            const totalParticipantsElement = document.getElementById('totalParticipants');
            if (totalParticipantsElement) {
                totalParticipantsElement.textContent = participants.length;
            }
            
            // Update player position
            const playerPositionElement = document.getElementById('playerPosition');
            if (playerPositionElement) {
                const playerIndex = participants.findIndex(p => p.id == this.playerId);
                playerPositionElement.textContent = playerIndex >= 0 ? `${playerIndex + 1}º` : '-';
            }
            
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }

    async handleParticipation() {
        try {
            const participateBtn = document.getElementById('participateBtn');
            if (!participateBtn) return;
            
            participateBtn.disabled = true;
            participateBtn.textContent = 'Processando...';
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.participationStatus = !this.participationStatus;
            this.updateParticipationStatus(this.participationStatus);
            
            if (this.participationStatus) {
                this.showMessage('Participação confirmada com sucesso!', 'success');
            } else {
                this.showMessage('Participação cancelada.', 'info');
            }
            
        } catch (error) {
            console.error('Erro ao processar participação:', error);
            this.showMessage('Erro ao processar participação. Tente novamente.', 'error');
        }
    }

    updateParticipationButtonState(state) {
        const participateBtn = document.getElementById('participateBtn');
        if (!participateBtn) return;
        
        participateBtn.disabled = false;
        
        if (state === 'participating') {
            participateBtn.textContent = 'Cancelar Participação';
            participateBtn.className = 'btn btn-danger';
        } else {
            participateBtn.textContent = 'Confirmar Participação';
            participateBtn.className = 'btn btn-success';
        }
    }

    checkParticipationStatus() {
        // Simulate checking participation status
        this.participationStatus = Math.random() > 0.5;
        this.updateParticipationStatus(this.participationStatus);
    }

    updateParticipationStatus(isParticipating) {
        const statusElement = document.getElementById('participationStatus');
        const statusText = document.getElementById('statusText');
        
        if (statusElement && statusText) {
            if (isParticipating) {
                statusElement.className = 'participation-status confirmed';
                statusText.textContent = 'Participação Confirmada';
                this.updateParticipationButtonState('participating');
            } else {
                statusElement.className = 'participation-status pending';
                statusText.textContent = 'Participação Pendente';
                this.updateParticipationButtonState('pending');
            }
        }
    }

    async updateLiveDistribution() {
        try {
            const distributionGrid = document.getElementById('distributionGrid');
            if (!distributionGrid) return;
            
            // Simulate different items with their own queues
            const itemQueues = [
                {
                    item: 'Pedra do Caos',
                    icon: '💎',
                    queue: [
                        { id: 1, name: 'Jogador Alpha', isCurrentPlayer: false, isCurrent: true },
                        { id: 2, name: 'Jogador Beta', isCurrentPlayer: false, isCurrent: false },
                        { id: this.playerId, name: this.playerName, isCurrentPlayer: true, isCurrent: false },
                        { id: 4, name: 'Jogador Delta', isCurrentPlayer: false, isCurrent: false },
                        { id: 5, name: 'Jogador Echo', isCurrentPlayer: false, isCurrent: false }
                    ]
                },
                {
                    item: 'Despertar',
                    icon: '⚡',
                    queue: [
                        { id: 2, name: 'Jogador Beta', isCurrentPlayer: false, isCurrent: true },
                        { id: 4, name: 'Jogador Delta', isCurrentPlayer: false, isCurrent: false },
                        { id: 1, name: 'Jogador Alpha', isCurrentPlayer: false, isCurrent: false },
                        { id: this.playerId, name: this.playerName, isCurrentPlayer: true, isCurrent: false },
                        { id: 6, name: 'Jogador Fox', isCurrentPlayer: false, isCurrent: false }
                    ]
                },
                {
                    item: 'Condor',
                    icon: '🦅',
                    queue: [
                        { id: this.playerId, name: this.playerName, isCurrentPlayer: true, isCurrent: true },
                        { id: 1, name: 'Jogador Alpha', isCurrentPlayer: false, isCurrent: false },
                        { id: 3, name: 'Jogador Gamma', isCurrentPlayer: false, isCurrent: false },
                        { id: 5, name: 'Jogador Echo', isCurrentPlayer: false, isCurrent: false },
                        { id: 7, name: 'Jogador Golf', isCurrentPlayer: false, isCurrent: false }
                    ]
                },
                {
                    item: 'Armadura Élfica',
                    icon: '🛡️',
                    queue: [
                        { id: 4, name: 'Jogador Delta', isCurrentPlayer: false, isCurrent: true },
                        { id: this.playerId, name: this.playerName, isCurrentPlayer: true, isCurrent: false },
                        { id: 2, name: 'Jogador Beta', isCurrentPlayer: false, isCurrent: false },
                        { id: 8, name: 'Jogador Hotel', isCurrentPlayer: false, isCurrent: false },
                        { id: 1, name: 'Jogador Alpha', isCurrentPlayer: false, isCurrent: false }
                    ]
                },
                {
                    item: 'Anel Mágico',
                    icon: '💍',
                    queue: [
                        { id: 5, name: 'Jogador Echo', isCurrentPlayer: false, isCurrent: true },
                        { id: 3, name: 'Jogador Gamma', isCurrentPlayer: false, isCurrent: false },
                        { id: this.playerId, name: this.playerName, isCurrentPlayer: true, isCurrent: false },
                        { id: 9, name: 'Jogador India', isCurrentPlayer: false, isCurrent: false },
                        { id: 2, name: 'Jogador Beta', isCurrentPlayer: false, isCurrent: false }
                    ]
                },
                {
                    item: 'Espada Flamejante',
                    icon: '🔥',
                    queue: [
                        { id: 6, name: 'Jogador Fox', isCurrentPlayer: false, isCurrent: true },
                        { id: this.playerId, name: this.playerName, isCurrentPlayer: true, isCurrent: false },
                        { id: 4, name: 'Jogador Delta', isCurrentPlayer: false, isCurrent: false },
                        { id: 1, name: 'Jogador Alpha', isCurrentPlayer: false, isCurrent: false },
                        { id: 10, name: 'Jogador Juliet', isCurrentPlayer: false, isCurrent: false }
                    ]
                }
            ];
            
            // Generate item blocks
            distributionGrid.innerHTML = itemQueues.map(itemData => {
                const currentTurn = itemData.queue.find(p => p.isCurrent);
                const playerPosition = itemData.queue.findIndex(p => p.isCurrentPlayer) + 1;
                const playerPositionText = playerPosition > 0 ? `${playerPosition}º lugar` : 'Não participando';
                
                return `
                    <div class="item-block">
                        <div class="item-header">
                            <div class="item-name">
                                <span>${itemData.icon}</span>
                                <span>${itemData.item}</span>
                            </div>
                            <div class="item-current-turn">
                                Vez de: <strong>${currentTurn ? currentTurn.name : 'Aguardando...'}</strong>
                            </div>
                            <div class="player-position-info">
                                <strong>Sua posição: ${playerPositionText}</strong>
                            </div>
                        </div>
                        
                        <div class="item-queue">
                            <h4>Próximos 5 jogadores:</h4>
                            ${itemData.queue.slice(0, 5).map((player, index) => {
                                let indicator = '';
                                if (player.isCurrentPlayer && player.isCurrent) {
                                    indicator = '<div class="player-indicator current-turn-indicator">Você - Sua Vez</div>';
                                } else if (player.isCurrentPlayer) {
                                    indicator = '<div class="player-indicator">Você</div>';
                                } else if (player.isCurrent) {
                                    indicator = '<div class="player-indicator current-turn-indicator">Atual</div>';
                                }
                                
                                return `
                                <div class="queue-player ${player.isCurrentPlayer ? 'current-player' : ''} ${player.isCurrent ? 'current-turn' : ''}">
                                    <div class="player-position">${index + 1}º</div>
                                    <div class="player-name">${player.name}</div>
                                    ${indicator}
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Erro ao atualizar distribuição:', error);
        }
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageElement = document.getElementById('messageContainer');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'messageContainer';
            messageElement.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000;';
            document.body.appendChild(messageElement);
        }
        
        const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
        messageElement.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
        
        setTimeout(() => {
            messageElement.innerHTML = '';
        }, 3000);
    }
}

// Global function for backward compatibility
function switchToSection(sectionName) {
    if (window.playerPanel) {
        window.playerPanel.switchToSection(sectionName);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.playerPanel = new PlayerPanel();
    window.playerPanel.init();
});