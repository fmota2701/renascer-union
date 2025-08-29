// Sistema de Cadastro de Jogadores - Renascer Union
class PlayerManager {
    constructor() {
        this.players = [];
        this.apiUrl = '/api/players';
        this.init();
    }

    async init() {
        await this.loadPlayers();
        this.bindEvents();
        this.renderPlayers();
    }

    bindEvents() {
        const form = document.getElementById('playerForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const nickInput = document.getElementById('playerNick');
        const nick = nickInput.value.trim();

        if (!nick) {
            this.showMessage('Por favor, digite um nick válido.', 'error');
            return;
        }

        // Verificar se estamos editando
        const editingId = form.dataset.editingId;
        
        if (editingId) {
            // Modo de edição
            if (await this.updatePlayer(editingId, nick)) {
                this.cancelEdit();
            }
        } else {
            // Modo de criação
            if (this.isNickExists(nick)) {
                this.showMessage('Este nick já está cadastrado!', 'error');
                return;
            }

            const player = this.createPlayer(nick);
            try {
                await this.addPlayer(player);
                
                nickInput.value = '';
                this.showMessage(`Jogador "${nick}" cadastrado com sucesso!`, 'success');
                this.renderPlayers();
            } catch (error) {
                this.showMessage('Erro ao cadastrar jogador. Tente novamente.', 'error');
            }
        }
    }

    createPlayer(nick) {
        return {
            id: this.generateId(),
            nick: nick,
            createdAt: new Date().toISOString()
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async addPlayer(player) {
        try {
            const savedPlayer = await this.savePlayer(player);
            this.players.push(savedPlayer);
        } catch (error) {
            throw error;
        }
    }

    async removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex > -1) {
            try {
                const removedPlayer = this.players[playerIndex];
                await this.deletePlayerAPI(playerId);
                this.players.splice(playerIndex, 1);
                this.showMessage(`Jogador "${removedPlayer.nick}" removido com sucesso!`, 'success');
                this.renderPlayers();
            } catch (error) {
                this.showMessage('Erro ao remover jogador!', 'error');
            }
        }
    }

    editPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        const nickInput = document.getElementById('playerNick');
        nickInput.value = player.nick;
        nickInput.focus();

        // Alterar o botão de submit temporariamente
        const form = document.getElementById('playerForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const cancelBtn = document.getElementById('cancelEditBtn');
        
        submitBtn.textContent = 'Atualizar Jogador';
        submitBtn.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
        cancelBtn.style.display = 'inline-block';
        
        // Adicionar atributo para identificar que estamos editando
        form.dataset.editingId = playerId;
        
        // Mostrar mensagem informativa
        this.showMessage(`Editando jogador "${player.nick}". Modifique o nick e clique em "Atualizar Jogador".`, 'success');
        
        // Scroll para o formulário
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async updatePlayer(playerId, newNick) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return false;

        // Verificar se o novo nick já existe (exceto para o próprio jogador)
        const nickExists = this.players.some(p => 
            p.id !== playerId && p.nick.toLowerCase() === newNick.toLowerCase()
        );
        
        if (nickExists) {
            this.showMessage('Este nick já está sendo usado por outro jogador!', 'error');
            return false;
        }

        try {
            const oldNick = this.players[playerIndex].nick;
            const updatedPlayer = {
                ...this.players[playerIndex],
                nick: newNick,
                updatedAt: new Date().toISOString()
            };
            
            await this.updatePlayerAPI(playerId, updatedPlayer);
            this.players[playerIndex] = updatedPlayer;
            
            this.showMessage(`Jogador "${oldNick}" atualizado para "${newNick}" com sucesso!`, 'success');
            this.renderPlayers();
            
            return true;
        } catch (error) {
            this.showMessage('Erro ao atualizar jogador!', 'error');
            return false;
        }
    }

    cancelEdit() {
        const form = document.getElementById('playerForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const cancelBtn = document.getElementById('cancelEditBtn');
        
        // Restaurar o botão original
        submitBtn.textContent = 'Cadastrar Jogador';
        submitBtn.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
        cancelBtn.style.display = 'none';
        
        // Remover atributo de edição
        delete form.dataset.editingId;
        
        // Limpar o formulário
        document.getElementById('playerNick').value = '';
        
        // Remover mensagens
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());
    }

    isNickExists(nick) {
        return this.players.some(player => 
            player.nick.toLowerCase() === nick.toLowerCase()
        );
    }

    async loadPlayers() {
        try {
            const response = await fetch(this.apiUrl);
            if (response.ok) {
                this.players = await response.json();
            } else {
                console.error('Erro ao carregar jogadores da API');
                this.players = [];
            }
        } catch (error) {
            console.error('Erro ao conectar com a API:', error);
            this.players = [];
        }
    }

    async savePlayer(player) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(player)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Erro ao salvar jogador');
            }
        } catch (error) {
            console.error('Erro ao salvar jogador:', error);
            throw error;
        }
    }

    async updatePlayerAPI(id, player) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(player)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Erro ao atualizar jogador');
            }
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    }

    async deletePlayerAPI(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao deletar jogador');
            }
        } catch (error) {
            console.error('Erro ao deletar jogador:', error);
            throw error;
        }
    }

    renderPlayers() {
        const playersList = document.getElementById('playersList');
        
        if (this.players.length === 0) {
            playersList.innerHTML = '<p class="no-players">Nenhum jogador cadastrado ainda.</p>';
            return;
        }

        const playersHTML = this.players
            .sort((a, b) => a.nick.toLowerCase().localeCompare(b.nick.toLowerCase()))
            .map(player => this.createPlayerCard(player))
            .join('');

        playersList.innerHTML = playersHTML;
    }

    createPlayerCard(player) {
        const createdDate = new Date(player.createdAt).toLocaleDateString('pt-BR');
        
        return `
            <div class="player-card">
                <div>
                    <div class="player-nick">${this.escapeHtml(player.nick)}</div>
                    <div class="player-id">ID: ${player.id} | Cadastrado em: ${createdDate}</div>
                </div>
                <div class="card-actions">
                    <button class="edit-btn" onclick="playerManager.editPlayer('${player.id}')">
                        Editar
                    </button>
                    <button class="delete-btn" onclick="playerManager.removePlayer('${player.id}')">
                        Remover
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        // Remove mensagens existentes
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        // Cria nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.textContent = message;

        // Insere a mensagem antes do formulário
        const formSection = document.querySelector('.form-section');
        formSection.insertBefore(messageDiv, formSection.firstChild);

        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Método para exportar dados (futuro uso)
    exportPlayers() {
        const dataStr = JSON.stringify(this.players, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'jogadores_renascer_union.json';
        link.click();
    }

    // Método para obter estatísticas
    getStats() {
        return {
            totalPlayers: this.players.length,
            oldestPlayer: this.players.length > 0 ? 
                this.players.reduce((oldest, player) => 
                    new Date(player.createdAt) < new Date(oldest.createdAt) ? player : oldest
                ) : null,
            newestPlayer: this.players.length > 0 ? 
                this.players.reduce((newest, player) => 
                    new Date(player.createdAt) > new Date(newest.createdAt) ? player : newest
                ) : null
        };
    }
}

// Inicializa o sistema quando a página carrega
let playerManager;

document.addEventListener('DOMContentLoaded', () => {
    playerManager = new PlayerManager();
    
    // Log de inicialização
    console.log('Sistema de Cadastro de Jogadores - Renascer Union iniciado!');
    console.log('Jogadores carregados:', playerManager.players.length);
});

// Adiciona atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter para submeter o formulário
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('playerForm');
        form.dispatchEvent(new Event('submit'));
    }
});