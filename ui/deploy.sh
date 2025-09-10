#!/bin/bash

# 🚀 Script de Deploy Automatizado
# Sistema de Itens React - Deploy para GitHub e Netlify

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do Sistema de Itens React..."
echo "📅 $(date)"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Erro: package.json não encontrado. Execute este script na pasta ui/"
    exit 1
fi

log_info "Verificando dependências..."

# Verificar se o Git está configurado
if ! git config user.name > /dev/null 2>&1; then
    log_warning "Configurando usuário Git..."
    git config user.name "Felipe Mota"
    git config user.email "fmota@example.com"
fi

# Verificar se há mudanças para commit
if git diff --quiet && git diff --staged --quiet; then
    log_info "Nenhuma mudança detectada para commit"
else
    log_info "Adicionando arquivos modificados..."
    git add .
    
    echo ""
    echo "📝 Digite a mensagem do commit (ou pressione Enter para usar padrão):"
    read -r commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="feat: atualizações do sistema - $(date '+%Y-%m-%d %H:%M')"
    fi
    
    log_info "Fazendo commit: $commit_message"
    git commit -m "$commit_message"
    log_success "Commit realizado com sucesso"
fi

# Verificar se o repositório remoto está configurado
if ! git remote get-url origin > /dev/null 2>&1; then
    log_warning "Repositório remoto não configurado!"
    echo ""
    echo "🔗 Para configurar o GitHub, siga estas etapas:"
    echo "1. Crie um repositório em: https://github.com/new"
    echo "2. Nome sugerido: sistema-itens-react"
    echo "3. Execute: git remote add origin https://github.com/SEU_USUARIO/sistema-itens-react.git"
    echo "4. Execute novamente este script"
    echo ""
    log_info "Consulte GITHUB_SETUP.md para instruções detalhadas"
    exit 1
fi

# Fazer push para GitHub
log_info "Enviando código para GitHub..."
if git push origin main; then
    log_success "Código enviado para GitHub com sucesso!"
else
    log_warning "Primeira vez? Configurando branch main..."
    git branch -M main
    git push -u origin main
    log_success "Código enviado para GitHub com sucesso!"
fi

# Verificar build local
log_info "Testando build local..."
if npm run build; then
    log_success "Build local executado com sucesso!"
else
    log_error "Erro no build local. Corrija os erros antes de fazer deploy."
    exit 1
fi

# Informações sobre Netlify
echo ""
log_info "📋 Próximos passos para Netlify:"
echo ""
echo "1. 🌐 Acesse: https://netlify.com"
echo "2. 🔗 Clique em 'New site from Git' → GitHub"
echo "3. 📁 Selecione o repositório: sistema-itens-react"
echo "4. ⚙️  Configurações de build (automáticas via netlify.toml):"
echo "   - Build command: npm run build"
echo "   - Publish directory: dist"
echo "5. 🔐 Configure as variáveis de ambiente (consulte NETLIFY_ENV_VARS.md):"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "6. 🚀 Deploy automático será iniciado!"
echo ""

# Informações finais
log_success "Deploy preparado com sucesso!"
echo ""
echo "📊 Resumo:"
echo "✅ Código commitado e enviado para GitHub"
echo "✅ Build local testado e funcionando"
echo "✅ Configurações de deploy prontas (netlify.toml)"
echo "✅ Guias de configuração disponíveis"
echo ""
echo "🔗 Links úteis:"
echo "📖 Guia completo: DEPLOY_GUIDE.md"
echo "🔧 Setup GitHub: GITHUB_SETUP.md"
echo "🔐 Variáveis Netlify: NETLIFY_ENV_VARS.md"
echo ""
log_info "Sistema pronto para produção! 🎉"