#!/bin/bash

# 🚀 Script de Deploy Automatizado - GitHub Pages
# Sistema de Distribuição de Itens da Guilda

set -e # Parar execução se houver erro

echo "🚀 Iniciando processo de deploy..."
echo "================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] && [ ! -d "ui" ]; then
    print_error "Este script deve ser executado no diretório raiz do projeto!"
    exit 1
fi

# Verificar se estamos em um repositório Git
if [ ! -d ".git" ]; then
    print_warning "Este não é um repositório Git. Inicializando..."
    git init
    print_status "Repositório Git inicializado."
fi

# Navegar para o diretório UI
print_status "Navegando para o diretório UI..."
cd ui

# Verificar se as variáveis de ambiente estão configuradas
print_status "Verificando variáveis de ambiente..."
if [ ! -f ".env.production" ]; then
    print_warning "Arquivo .env.production não encontrado!"
    print_status "Criando arquivo .env.production de exemplo..."
    cat > .env.production << EOF
# Configurações de Produção
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
EOF
    print_warning "Por favor, edite o arquivo .env.production com suas credenciais reais!"
fi

# Limpar cache se solicitado
if [ "$1" = "--clean" ]; then
    print_status "Limpando cache e dependências..."
    rm -rf node_modules package-lock.json dist .vite
    npm cache clean --force
fi

# Instalar dependências
print_status "Instalando dependências..."
npm install

# Build para produção
print_status "Gerando build de produção..."
NODE_ENV=production npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    print_error "Build falhou! Diretório dist não foi criado."
    exit 1
fi

print_success "Build gerado com sucesso!"

# Voltar para o diretório raiz
cd ..

# Verificar se há alterações para commit
if [ -n "$(git status --porcelain)" ]; then
    print_status "Alterações detectadas, fazendo commit..."
    
    # Adicionar todas as alterações
    git add .
    
    # Solicitar mensagem de commit
    echo "💬 Digite a mensagem do commit (ou pressione Enter para usar mensagem padrão):"
    read commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="deploy: build atualizado em $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # Fazer commit
    print_status "Fazendo commit: $commit_message"
    git commit -m "$commit_message"
    print_success "Commit realizado com sucesso!"
else
    print_warning "Nenhuma alteração detectada para commit."
fi

# Verificar se o remote origin existe
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "Remote 'origin' não configurado."
    print_status "Configure o remote com: git remote add origin https://github.com/SEU_USUARIO/sistema-distribuicao-itens.git"
    print_warning "Pressione Enter para continuar sem fazer push, ou Ctrl+C para cancelar..."
    read
else
    # Push para o GitHub
    print_status "Fazendo push para o GitHub..."
    
    # Verificar se a branch main existe
    if git show-ref --verify --quiet refs/heads/main; then
        BRANCH="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        BRANCH="master"
    else
        BRANCH="main"
        git branch -M main
    fi
    
    print_status "Fazendo push para a branch $BRANCH..."
    git push origin $BRANCH
    
    print_success "Deploy enviado para o GitHub!"
fi

# Mostrar estatísticas do build
print_status "Estatísticas do build:"
if [ -d "ui/dist" ]; then
    du -sh ui/dist/
    echo "Principais arquivos gerados:"
    find ui/dist -type f -name "*.js" -o -name "*.css" -o -name "*.html" | head -5
fi

# Informações finais
echo ""
print_success "🎉 Deploy concluído com sucesso!"
echo ""
print_status "Próximos passos:"
echo "1. Verifique o GitHub Actions em: https://github.com/SEU_USUARIO/sistema-distribuicao-itens/actions"
echo "2. Aguarde alguns minutos para o deploy ser processado"
echo "3. Acesse seu site em: https://SEU_USUARIO.github.io/sistema-distribuicao-itens/"
echo ""
print_status "Para monitorar o progresso:"
echo "- GitHub Actions: Vá até a aba 'Actions' no seu repositório"
echo "- GitHub Pages: Settings → Pages no seu repositório"
echo ""
print_warning "Lembre-se de configurar as variáveis de ambiente no GitHub:"
echo "- VITE_SUPABASE_URL"
echo "- VITE_SUPABASE_ANON_KEY"
echo ""
print_status "📖 Para mais detalhes, consulte o DEPLOY_GITHUB.md"
print_success "Happy coding! 🚀"