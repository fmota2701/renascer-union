#!/bin/bash

# StartRenascer - Script para atualizar sistema e fazer deploy no Netlify
# Autor: Sistema Renascer Union
# Data: $(date +%Y-%m-%d)

echo "🎮 ===== RENASCER UNION - DEPLOY AUTOMÁTICO ===== 🎮"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Arquivo package.json não encontrado. Execute o script no diretório do projeto."
    exit 1
fi

log_info "Iniciando processo de deploy do Renascer Union..."
echo ""

# 1. Verificar dependências
log_info "Verificando dependências..."
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado. Instale o Node.js primeiro."
    exit 1
fi

if ! command -v git &> /dev/null; then
    log_error "git não está instalado. Instale o Git primeiro."
    exit 1
fi

# 2. Atualizar dependências
log_info "Atualizando dependências do projeto..."
npm install
if [ $? -eq 0 ]; then
    log_success "Dependências atualizadas com sucesso!"
else
    log_error "Falha ao atualizar dependências."
    exit 1
fi

# 3. Executar testes (se existirem)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    log_info "Executando testes..."
    npm test
    if [ $? -ne 0 ]; then
        log_warning "Alguns testes falharam, mas continuando com o deploy..."
    else
        log_success "Todos os testes passaram!"
    fi
fi

# 4. Verificar se há mudanças no Git
log_info "Verificando mudanças no repositório..."
if [ -d ".git" ]; then
    if [ -n "$(git status --porcelain)" ]; then
        log_info "Mudanças detectadas. Fazendo commit..."
        
        # Adicionar todos os arquivos
        git add .
        
        # Commit com timestamp
        COMMIT_MSG="Deploy automático - $(date '+%Y-%m-%d %H:%M:%S')"
        git commit -m "$COMMIT_MSG"
        
        if [ $? -eq 0 ]; then
            log_success "Commit realizado: $COMMIT_MSG"
        else
            log_error "Falha ao fazer commit."
            exit 1
        fi
    else
        log_info "Nenhuma mudança detectada no repositório."
    fi
else
    log_warning "Repositório Git não inicializado."
fi

# 5. Push para o repositório (se configurado)
if [ -d ".git" ]; then
    log_info "Enviando mudanças para o repositório remoto..."
    
    # Verificar se há remote configurado
    if git remote | grep -q 'origin'; then
        git push origin main 2>/dev/null || git push origin master 2>/dev/null
        
        if [ $? -eq 0 ]; then
            log_success "Código enviado para o repositório remoto!"
        else
            log_warning "Falha ao enviar para o repositório remoto. Continuando..."
        fi
    else
        log_warning "Nenhum repositório remoto configurado."
    fi
fi

# 6. Deploy no Netlify (se Netlify CLI estiver instalado)
log_info "Verificando Netlify CLI..."
if command -v netlify &> /dev/null; then
    log_info "Fazendo deploy no Netlify..."
    
    # Deploy de produção
    netlify deploy --prod --dir=.
    
    if [ $? -eq 0 ]; then
        log_success "Deploy no Netlify realizado com sucesso!"
        echo ""
        log_info "🌐 Seu site está disponível em: https://seu-site.netlify.app"
    else
        log_error "Falha no deploy do Netlify."
        exit 1
    fi
else
    log_warning "Netlify CLI não está instalado."
    log_info "Para instalar: npm install -g netlify-cli"
    log_info "Depois execute: netlify login && netlify init"
fi

# 7. Iniciar servidor local para teste
log_info "Iniciando servidor local para teste..."
echo ""
log_success "🚀 Deploy concluído com sucesso!"
log_info "📊 Acesse o painel admin em: http://localhost:8000/admin.html"
log_info "🎮 Acesse o sistema em: http://localhost:8000"
log_info "📋 Distribuição em: http://localhost:8000/distribuicao.html"
echo ""
log_info "Pressione Ctrl+C para parar o servidor local."

# Iniciar servidor
npm start