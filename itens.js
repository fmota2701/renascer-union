// Sistema de Cadastro de Itens - Renascer Union
class ItemManager {
    constructor() {
        this.items = [];
        this.apiUrl = '/api/items';
        this.init();
    }

    async init() {
        await this.loadItems();
        this.bindEvents();
        this.renderItems();
    }

    bindEvents() {
        const form = document.getElementById('itemForm');
        const categoryFilter = document.getElementById('categoryFilter');
        
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        categoryFilter.addEventListener('change', () => this.renderItems());
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const nameInput = document.getElementById('itemName');
        const descriptionInput = document.getElementById('itemDescription');
        const categoryInput = document.getElementById('itemCategory');
        
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        const category = categoryInput.value;

        if (!name) {
            this.showMessage('Por favor, digite um nome válido para o item.', 'error');
            return;
        }

        if (!category) {
            this.showMessage('Por favor, selecione uma categoria para o item.', 'error');
            return;
        }

        // Verificar se estamos editando
        const editingId = form.dataset.editingId;
        
        if (editingId) {
            // Modo de edição
            if (await this.updateItem(editingId, name, description, category)) {
                this.cancelEdit();
            }
        } else {
            // Modo de criação
            if (this.isItemExists(name)) {
                this.showMessage('Este item já está cadastrado!', 'error');
                return;
            }

            const item = this.createItem(name, description, category);
            await this.addItem(item);
            
            nameInput.value = '';
            descriptionInput.value = '';
            categoryInput.value = '';
            
            this.showMessage(`Item "${name}" cadastrado com sucesso!`, 'success');
            this.renderItems();
        }
    }

    createItem(name, description, category) {
        return {
            id: this.generateId(),
            name: name,
            description: description || '',
            category: category,
            createdAt: new Date().toISOString()
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async addItem(item) {
        try {
            const savedItem = await this.saveItem(item);
            this.items.push(savedItem);
        } catch (error) {
            this.showMessage('Erro ao salvar item na API', 'error');
        }
    }

    async removeItem(itemId) {
        try {
            await this.deleteItemAPI(itemId);
            const itemIndex = this.items.findIndex(i => i.id === itemId);
            if (itemIndex > -1) {
                const removedItem = this.items.splice(itemIndex, 1)[0];
                this.showMessage(`Item "${removedItem.name}" removido com sucesso!`, 'success');
                this.renderItems();
            }
        } catch (error) {
            this.showMessage('Erro ao remover item da API', 'error');
        }
    }

    editItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        const nameInput = document.getElementById('itemName');
        const descriptionInput = document.getElementById('itemDescription');
        const categoryInput = document.getElementById('itemCategory');
        
        nameInput.value = item.name;
        descriptionInput.value = item.description || '';
        categoryInput.value = item.category;
        nameInput.focus();

        // Alterar o botão de submit temporariamente
        const form = document.getElementById('itemForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const cancelBtn = document.getElementById('cancelEditItemBtn');
        
        submitBtn.textContent = 'Atualizar Item';
        submitBtn.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        
        // Adicionar atributo para identificar que estamos editando
        form.dataset.editingId = itemId;
        
        // Mostrar mensagem informativa
        this.showMessage(`Editando item "${item.name}". Modifique os campos e clique em "Atualizar Item".`, 'success');
        
        // Scroll para o formulário
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async updateItem(itemId, name, description, category) {
        const itemIndex = this.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return false;

        // Verificar se o novo nome já existe (exceto para o próprio item)
        const nameExists = this.items.some(i => 
            i.id !== itemId && i.name.toLowerCase() === name.toLowerCase()
        );
        
        if (nameExists) {
            this.showMessage('Este nome de item já está sendo usado!', 'error');
            return false;
        }

        const oldName = this.items[itemIndex].name;
        const updatedItem = {
            ...this.items[itemIndex],
            name: name,
            description: description,
            category: category,
            updatedAt: new Date().toISOString()
        };
        
        try {
            await this.updateItemAPI(itemId, updatedItem);
            this.items[itemIndex] = updatedItem;
        } catch (error) {
            this.showMessage('Erro ao atualizar item na API', 'error');
            return false;
        }
        this.showMessage(`Item "${oldName}" atualizado com sucesso!`, 'success');
        this.renderItems();
        
        return true;
    }

    cancelEdit() {
        const form = document.getElementById('itemForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const cancelBtn = document.getElementById('cancelEditItemBtn');
        
        // Restaurar o botão original
        submitBtn.textContent = 'Cadastrar Item';
        submitBtn.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        // Remover atributo de edição
        delete form.dataset.editingId;
        
        // Limpar o formulário
        document.getElementById('itemName').value = '';
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemCategory').value = '';
        
        // Remover mensagens
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());
    }

    isItemExists(name) {
        return this.items.some(item => 
            item.name.toLowerCase() === name.toLowerCase()
        );
    }

    async loadItems() {
        try {
            const response = await fetch(this.apiUrl);
            if (response.ok) {
                this.items = await response.json();
            } else {
                console.error('Erro ao carregar itens da API');
                this.items = [];
            }
        } catch (error) {
            console.error('Erro ao conectar com a API:', error);
            this.items = [];
        }
    }

    async saveItem(item) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Erro ao salvar item');
            }
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            throw error;
        }
    }

    async updateItemAPI(id, item) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Erro ao atualizar item');
            }
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            throw error;
        }
    }

    async deleteItemAPI(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao deletar item');
            }
        } catch (error) {
            console.error('Erro ao deletar item:', error);
            throw error;
        }
    }

    getFilteredItems() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        let filteredItems = this.items;
        
        if (categoryFilter) {
            filteredItems = this.items.filter(item => item.category === categoryFilter);
        }
        
        return filteredItems.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    }

    renderItems() {
        const itemsList = document.getElementById('itemsList');
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            const categoryFilter = document.getElementById('categoryFilter').value;
            const message = categoryFilter ? 
                `Nenhum item encontrado na categoria "${this.getCategoryName(categoryFilter)}".` :
                'Nenhum item cadastrado ainda.';
            itemsList.innerHTML = `<p class="no-players">${message}</p>`;
            return;
        }

        const itemsHTML = filteredItems
            .map(item => this.createItemCard(item))
            .join('');

        itemsList.innerHTML = itemsHTML;
    }

    createItemCard(item) {
        const createdDate = new Date(item.createdAt).toLocaleDateString('pt-BR');
        const categoryName = this.getCategoryName(item.category);
        
        return `
            <div class="item-card">
                <div>
                    <div class="player-nick">${this.escapeHtml(item.name)}</div>
                    <div class="player-id">
                        Categoria: ${categoryName} | 
                        ${item.description ? `Descrição: ${this.escapeHtml(item.description)} | ` : ''}
                        Cadastrado em: ${createdDate}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="edit-btn" onclick="itemManager.editItem('${item.id}')">
                        Editar
                    </button>
                    <button class="delete-btn" onclick="itemManager.removeItem('${item.id}')">
                        Remover
                    </button>
                </div>
            </div>
        `;
    }

    getCategoryName(category) {
        const categories = {
            'arma': 'Arma',
            'armadura': 'Armadura',
            'acessorio': 'Acessório',
            'consumivel': 'Consumível',
            'material': 'Material',
            'quest': 'Quest',
            'outros': 'Outros'
        };
        return categories[category] || category;
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

    // Método para exportar dados
    exportItems() {
        const dataStr = JSON.stringify(this.items, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'itens_renascer_union.json';
        link.click();
    }

    // Método para obter estatísticas
    getStats() {
        const categoryStats = {};
        this.items.forEach(item => {
            categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
        });
        
        return {
            totalItems: this.items.length,
            categoriesCount: Object.keys(categoryStats).length,
            categoryBreakdown: categoryStats,
            oldestItem: this.items.length > 0 ? 
                this.items.reduce((oldest, item) => 
                    new Date(item.createdAt) < new Date(oldest.createdAt) ? item : oldest
                ) : null,
            newestItem: this.items.length > 0 ? 
                this.items.reduce((newest, item) => 
                    new Date(item.createdAt) > new Date(newest.createdAt) ? item : newest
                ) : null
        };
    }

    // Método para buscar itens por nome
    searchItems(searchTerm) {
        if (!searchTerm) return this.items;
        
        const term = searchTerm.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term)
        );
    }
}

// Inicializa o sistema quando a página carrega
let itemManager;

document.addEventListener('DOMContentLoaded', () => {
    itemManager = new ItemManager();
    
    // Log de inicialização
    console.log('Sistema de Cadastro de Itens - Renascer Union iniciado!');
    console.log('Itens carregados:', itemManager.items.length);
});

// Adiciona atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter para submeter o formulário
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('itemForm');
        form.dispatchEvent(new Event('submit'));
    }
});