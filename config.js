// Configuration Management
const CONFIG_STORAGE_KEY = 'guild-loot-config';
const MAIN_STORAGE_KEY = 'guild-loot-state';

// Default configuration
const DEFAULT_CONFIG = {
    soundEnabled: true,
    autoSaveNick: true,
    showAnimations: true,
    darkMode: false
};

// Load configuration from localStorage
function loadConfig() {
    try {
        const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
        return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        return DEFAULT_CONFIG;
    }
}

// Save configuration to localStorage
function saveConfig(config) {
    try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        return false;
    }
}

// Load main application state
function loadMainState() {
    try {
        const saved = localStorage.getItem(MAIN_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Erro ao carregar estado principal:', error);
        return null;
    }
}

// Initialize configuration page
function initConfigPage() {
    const config = loadConfig();
    
    // Set checkbox values
    document.getElementById('soundEnabled').checked = config.soundEnabled;
    document.getElementById('autoSaveNick').checked = config.autoSaveNick;
    document.getElementById('showAnimations').checked = config.showAnimations;
    document.getElementById('darkMode').checked = config.darkMode;
    
    // Load system stats
    loadSystemStats();
    
    // Apply dark mode if enabled
    if (config.darkMode) {
        document.body.classList.add('dark-mode');
    }
}

// Load system statistics
function loadSystemStats() {
    const state = loadMainState();
    
    if (state) {
        const totalPlayers = Object.keys(state.players || {}).length;
        const presentPlayers = Object.values(state.players || {}).filter(p => p.present).length;
        const totalDistributions = calculateTotalDistributions(state);
        
        document.getElementById('totalPlayers').textContent = totalPlayers;
        document.getElementById('presentPlayers').textContent = presentPlayers;
        document.getElementById('totalDistributions').textContent = totalDistributions;
    } else {
        document.getElementById('totalPlayers').textContent = '0';
        document.getElementById('presentPlayers').textContent = '0';
        document.getElementById('totalDistributions').textContent = '0';
    }
}

// Calculate total distributions
function calculateTotalDistributions(state) {
    let total = 0;
    if (state.players) {
        Object.values(state.players).forEach(player => {
            if (player.items) {
                Object.values(player.items).forEach(count => {
                    total += count;
                });
            }
        });
    }
    return total;
}

// Save settings
function saveSettings() {
    const config = {
        soundEnabled: document.getElementById('soundEnabled').checked,
        autoSaveNick: document.getElementById('autoSaveNick').checked,
        showAnimations: document.getElementById('showAnimations').checked,
        darkMode: document.getElementById('darkMode').checked
    };
    
    if (saveConfig(config)) {
        // Apply dark mode immediately
        if (config.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        showNotification('Configurações salvas com sucesso!', 'success');
    } else {
        showNotification('Erro ao salvar configurações!', 'error');
    }
}

// Go back to main page
function goToMain() {
    window.location.href = 'index.html';
}

// Reset functions
function resetPresences() {
    if (confirm('Tem certeza que deseja resetar todas as presenças? Esta ação não pode ser desfeita.')) {
        const state = loadMainState();
        if (state && state.players) {
            Object.keys(state.players).forEach(nick => {
                state.players[nick].present = false;
            });
            
            localStorage.setItem(MAIN_STORAGE_KEY, JSON.stringify(state));
            showNotification('Presenças resetadas com sucesso!', 'success');
            loadSystemStats();
        }
    }
}

function resetItems() {
    if (confirm('Tem certeza que deseja resetar todos os itens recebidos? Esta ação não pode ser desfeita.')) {
        const state = loadMainState();
        if (state && state.players) {
            Object.keys(state.players).forEach(nick => {
                state.players[nick].items = {};
            });
            
            localStorage.setItem(MAIN_STORAGE_KEY, JSON.stringify(state));
            showNotification('Itens resetados com sucesso!', 'success');
            loadSystemStats();
        }
    }
}

function resetFaults() {
    if (confirm('Tem certeza que deseja resetar todas as faltas? Esta ação não pode ser desfeita.')) {
        const state = loadMainState();
        if (state && state.players) {
            Object.keys(state.players).forEach(nick => {
                if (state.players[nick].faults) {
                    state.players[nick].faults = 0;
                }
            });
            
            localStorage.setItem(MAIN_STORAGE_KEY, JSON.stringify(state));
            showNotification('Faltas resetadas com sucesso!', 'success');
            loadSystemStats();
        }
    }
}

function resetPlayers() {
    if (confirm('Tem certeza que deseja resetar todos os jogadores? Esta ação não pode ser desfeita.')) {
        const state = loadMainState();
        if (state) {
            state.players = {};
            localStorage.setItem(MAIN_STORAGE_KEY, JSON.stringify(state));
            showNotification('Jogadores resetados com sucesso!', 'success');
            loadSystemStats();
        }
    }
}

function resetAll() {
    if (confirm('ATENÇÃO: Tem certeza que deseja resetar TODOS os dados? Esta ação não pode ser desfeita e apagará tudo!')) {
        if (confirm('Esta é sua última chance. Confirma que deseja apagar TODOS os dados?')) {
            localStorage.removeItem(MAIN_STORAGE_KEY);
            showNotification('Todos os dados foram resetados!', 'success');
            loadSystemStats();
        }
    }
}

function resetHistory() {
    if (confirm('Tem certeza que deseja resetar o histórico? Esta ação não pode ser desfeita!')) {
        const state = loadMainState();
        if (state) {
            state.history = [];
            localStorage.setItem(MAIN_STORAGE_KEY, JSON.stringify(state));
            showNotification('Histórico resetado com sucesso!', 'success');
            loadSystemStats();
        }
    }
}

function resetDistributedItems() {
    if (confirm('Tem certeza que deseja resetar os itens já distribuídos? Esta ação não pode ser desfeita!')) {
        const state = loadMainState();
        if (state && state.players) {
            // Reset distributed items for all players
            Object.keys(state.players).forEach(playerId => {
                if (state.players[playerId].distributedItems) {
                    state.players[playerId].distributedItems = [];
                }
            });
            localStorage.setItem(MAIN_STORAGE_KEY, JSON.stringify(state));
            showNotification('Itens distribuídos resetados com sucesso!', 'success');
            loadSystemStats();
        }
    }
}

// Export data
function exportData() {
    const state = loadMainState();
    const config = loadConfig();
    
    const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        state: state,
        config: config
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `guild-loot-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Dados exportados com sucesso!', 'success');
}

// Import data
function importData() {
    document.getElementById('importFile').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (importData.state) {
                localStorage.setItem(MAIN_STORAGE_KEY, JSON.stringify(importData.state));
            }
            
            if (importData.config) {
                saveConfig(importData.config);
            }
            
            showNotification('Dados importados com sucesso!', 'success');
            loadSystemStats();
            initConfigPage();
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showNotification('Erro ao importar dados! Verifique se o arquivo está correto.', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        default:
            notification.style.backgroundColor = '#3b82f6';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initConfigPage);