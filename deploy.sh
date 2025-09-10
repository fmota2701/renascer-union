#!/bin/bash

# Script de Deploy Automatizado
# Sistema de Distribuição de Itens da Guilda

echo "🚀 Iniciando processo de deploy..."
echo "================================="

# Verificar se estamos em um repositório Git
if [ ! -d ".git" ]; then
    echo "❌ Erro: Este não é um repositório Git"
    exit 1
fi

# Verificar se há alterações para commit
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Alterações detectadas, fazendo commit..."
    
    # Adicionar todas as alterações
    git add .
    
    # Solicitar mensagem de commit
    echo "💬 Digite a mensagem do commit (ou pressione Enter para usar mensagem padrão):"
    read commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="Deploy: Atualizações do sistema $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # Fazer commit
    git commit -m "$commit_message"
    
    if [ $? -eq 0 ]; then
        echo "✅ Commit realizado com sucesso"
    else
        echo "❌ Erro ao fazer commit"
        exit 1
    fi
else
    echo "ℹ️  Nenhuma alteração detectada"
fi

# Fazer push para o GitHub
echo "📤 Enviando alterações para o GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso"
else
    echo "❌ Erro ao fazer push"
    exit 1
fi

# Verificar status do repositório
echo "📊 Status do repositório:"
git status --short

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "================================="
echo "📋 Próximos passos:"
echo "1. Acesse https://netlify.com"
echo "2. Conecte seu repositório GitHub"
echo "3. Configure as variáveis de ambiente"
echo "4. Faça o deploy do site"
echo ""
echo "📖 Para mais detalhes, consulte o DEPLOY_GUIDE.md"
echo "🔗 Repositório: https://github.com/fmota2701/renascer-union.git"