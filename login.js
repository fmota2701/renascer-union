class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingSession();
    }

    bindEvents() {
        // Form submissions
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        document.getElementById('playerLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePlayerLogin();
        });
    }

    handleAdminLogin() {
        const password = document.getElementById('adminPassword').value;
        
        if (password === 'f3l1p3') {
            // Store admin session
            sessionStorage.setItem('userType', 'admin');
            sessionStorage.setItem('userName', 'Administrador');
            
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
        } else {
            this.showError('Senha incorreta!');
        }
    }

    async handlePlayerLogin() {
        const nick = document.getElementById('playerNick').value.trim();
        
        if (!nick) {
            this.showError('Por favor, digite seu nick!');
            return;
        }

        try {
            // Check if player exists in the database
            const players = await api.getPlayers();
            
            const player = players.find(p => p.nick.toLowerCase() === nick.toLowerCase());
            
            if (player) {
                // Store player session
                sessionStorage.setItem('userType', 'player');
                sessionStorage.setItem('userName', player.nick);
                sessionStorage.setItem('playerId', player.id);
                
                // Redirect to player panel
                window.location.href = 'player.html';
            } else {
                this.showError('Jogador não encontrado! Verifique se seu nick está cadastrado.');
            }
        } catch (error) {
            console.error('Erro ao verificar jogador:', error);
            this.showError('Erro ao conectar com o servidor. Tente novamente.');
        }
    }

    showError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create and show new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        const activeTab = document.querySelector('.tab-content.active');
        activeTab.appendChild(errorDiv);

        // Remove error after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }

    checkExistingSession() {
        const userType = sessionStorage.getItem('userType');
        
        if (userType === 'admin') {
            window.location.href = 'admin.html';
        } else if (userType === 'player') {
            window.location.href = 'player.html';
        }
    }
}

// Initialize login manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});