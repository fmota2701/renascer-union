# 🚀 Guia de Deploy - GitHub Pages

Este guia explica como fazer o deploy do Sistema de Distribuição de Itens no GitHub Pages com deploy automático.

## 📋 Pré-requisitos

- Conta no GitHub
- Projeto Supabase configurado
- Node.js 18+ instalado localmente

## 🔧 Configuração Inicial

### 1. Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com) e faça login
2. Clique em "New repository"
3. Nome sugerido: `sistema-distribuicao-itens`
4. Marque como "Public" (necessário para GitHub Pages gratuito)
5. **NÃO** inicialize com README (já temos arquivos)
6. Clique em "Create repository"

### 2. Configurar Git Localmente

```bash
# Navegar para o diretório do projeto
cd "/Users/fmota/Library/Mobile Documents/com~apple~CloudDocs/RENASCER/ATUALIZAR"

# Inicializar repositório Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "feat: sistema completo de distribuição de itens com design Apple"

# Adicionar repositório remoto (substitua SEU_USUARIO pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/sistema-distribuicao-itens.git

# Fazer push para o GitHub
git branch -M main
git push -u origin main
```

### 3. Configurar Secrets no GitHub

1. No seu repositório GitHub, vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret** e adicione:

**VITE_SUPABASE_URL**
```
Sua URL do Supabase (ex: https://xxxxx.supabase.co)
```

**VITE_SUPABASE_ANON_KEY**
```
Sua chave anônima do Supabase
```

### 4. Ativar GitHub Pages

1. No repositório, vá em **Settings** → **Pages**
2. Em **Source**, selecione "GitHub Actions"
3. O deploy será automático a partir do próximo push

## 🏗️ Build e Deploy

### Deploy Automático

O deploy acontece automaticamente quando você faz push para a branch `main`:

```bash
# Fazer mudanças no código
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

### Deploy Manual Local (para testes)

```bash
# Navegar para o diretório UI
cd ui

# Instalar dependências
npm install

# Criar arquivo de ambiente para produção
echo "VITE_SUPABASE_URL=sua_url_aqui" > .env.production
echo "VITE_SUPABASE_ANON_KEY=sua_chave_aqui" >> .env.production

# Build para produção
npm run build

# Testar build localmente
npm run preview
```

## 🌐 URLs de Acesso

Após o deploy bem-sucedido:

- **URL Principal**: `https://SEU_USUARIO.github.io/sistema-distribuicao-itens/`
- **Admin Dashboard**: `https://SEU_USUARIO.github.io/sistema-distribuicao-itens/#/admin`
- **Player Dashboard**: `https://SEU_USUARIO.github.io/sistema-distribuicao-itens/#/player/NOME_DO_JOGADOR`

## 🔍 Verificação do Deploy

### 1. Verificar Actions
1. Vá em **Actions** no seu repositório
2. Verifique se o workflow "Deploy to GitHub Pages" executou com sucesso
3. Se houver erro, clique no workflow para ver os logs

### 2. Testar Funcionalidades
- [ ] Login de administrador
- [ ] Cadastro de jogadores
- [ ] Cadastro de itens
- [ ] Distribuição de itens
- [ ] Visualização de histórico
- [ ] Dashboard do jogador

## 🛠️ Solução de Problemas

### Erro: "Failed to fetch"
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o Supabase está configurado corretamente
- Verifique as políticas RLS no Supabase

### Erro: "404 Not Found"
- Aguarde alguns minutos após o deploy
- Verifique se o GitHub Pages está ativado
- Confirme se a branch está correta

### Erro no Build
- Verifique os logs no GitHub Actions
- Teste o build localmente primeiro
- Confirme se todas as dependências estão no package.json

## 🔄 Atualizações Futuras

### Workflow de Desenvolvimento

1. **Desenvolvimento Local**:
   ```bash
   cd ui
   npm run dev
   ```

2. **Teste de Build**:
   ```bash
   npm run build
   npm run preview
   ```

3. **Deploy**:
   ```bash
   git add .
   git commit -m "descrição das mudanças"
   git push origin main
   ```

### Branches Recomendadas

- `main`: Produção (deploy automático)
- `develop`: Desenvolvimento
- `feature/nome-da-feature`: Novas funcionalidades

## 📊 Monitoramento

### Analytics (Opcional)
Para adicionar Google Analytics:

1. Crie uma conta no Google Analytics
2. Adicione o código de tracking no `index.html`
3. Faça commit e push das mudanças

### Logs de Erro
Para monitorar erros em produção, considere integrar:
- Sentry
- LogRocket
- Bugsnag

## 🔐 Segurança

### Variáveis de Ambiente
- ✅ Nunca commite arquivos `.env`
- ✅ Use GitHub Secrets para dados sensíveis
- ✅ Rotacione chaves periodicamente

### Supabase
- ✅ Configure RLS (Row Level Security)
- ✅ Use políticas restritivas
- ✅ Monitore uso da API

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do GitHub Actions
2. Teste localmente primeiro
3. Consulte a documentação do Supabase
4. Verifique as configurações do GitHub Pages

---

**🎉 Parabéns! Seu sistema está agora deployado e acessível globalmente via GitHub Pages!**