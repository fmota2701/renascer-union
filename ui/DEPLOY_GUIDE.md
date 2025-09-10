# 🚀 Guia de Deploy - Sistema de Itens React

Guia completo para fazer deploy do sistema migrado para React/Vite no GitHub e Netlify.

## 📋 Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta no Netlify
- [ ] Projeto Supabase configurado
- [ ] Git instalado localmente

## 🔧 Passo 1: Preparar o Repositório GitHub

### 1.1 Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com) e faça login
2. Clique em "New repository"
3. Configure o repositório:
   - **Nome**: `sistema-itens-react` (ou nome de sua escolha)
   - **Descrição**: "Sistema de gerenciamento de itens migrado para React/Vite"
   - **Visibilidade**: Private ou Public (sua escolha)
   - **NÃO** marque "Add a README file" (já temos um)
   - **NÃO** adicione .gitignore (já temos um)
4. Clique em "Create repository"

### 1.2 Conectar Repositório Local

No terminal, dentro da pasta `ui/`:

```bash
# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "feat: migração completa do sistema HTML/JS para React/Vite

- Implementação completa de todos os componentes
- Integração com Supabase mantida
- Tema dark red preservado
- Roteamento com React Router
- Estado global com Context API
- Configuração de build otimizada"

# Adicionar origem remota (substitua SEU_USUARIO pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/sistema-itens-react.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

## 🌐 Passo 2: Configurar Deploy no Netlify

### 2.1 Conectar Repositório

1. Acesse [Netlify](https://netlify.com) e faça login
2. Clique em "New site from Git"
3. Escolha "GitHub" como provedor
4. Autorize o Netlify a acessar seus repositórios
5. Selecione o repositório `sistema-itens-react`

### 2.2 Configurar Build Settings

O Netlify deve detectar automaticamente as configurações do `netlify.toml`, mas verifique:

- **Base directory**: ` ` (vazio, pois o netlify.toml está na raiz)
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 2.3 Configurar Variáveis de Ambiente

1. No dashboard do Netlify, vá para "Site settings"
2. Clique em "Environment variables"
3. Adicione as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase_aqui
VITE_APP_NAME=Sistema de Itens
VITE_APP_VERSION=1.0.0
```

**⚠️ IMPORTANTE**: Substitua pelos valores reais do seu projeto Supabase!

### 2.4 Deploy Inicial

1. Clique em "Deploy site"
2. Aguarde o build completar (pode levar alguns minutos)
3. Seu site estará disponível em uma URL como `https://amazing-name-123456.netlify.app`

## 🔄 Passo 3: Configurar Deploy Automático

### 3.1 Deploy Automático por Branch

O deploy automático já está configurado! Sempre que você fizer push para a branch `main`, o Netlify fará deploy automaticamente.

### 3.2 Preview de Pull Requests

O Netlify também criará previews automáticos para Pull Requests, permitindo testar mudanças antes do merge.

## 🎯 Passo 4: Configurar Domínio Personalizado (Opcional)

### 4.1 Domínio Netlify Personalizado

1. No dashboard do Netlify, vá para "Site settings" > "Domain management"
2. Clique em "Options" > "Edit site name"
3. Escolha um nome personalizado: `meu-sistema-itens.netlify.app`

### 4.2 Domínio Próprio

Se você tem um domínio próprio:

1. Vá para "Domain management" > "Add custom domain"
2. Digite seu domínio: `meusite.com`
3. Configure os DNS conforme instruções do Netlify
4. O Netlify fornecerá SSL automático via Let's Encrypt

## 🔐 Passo 5: Configurações de Segurança

### 5.1 Variáveis de Ambiente Seguras

- ✅ Nunca commite arquivos `.env` no Git
- ✅ Use apenas variáveis que começam com `VITE_` no frontend
- ✅ Mantenha chaves sensíveis apenas no Netlify

### 5.2 Headers de Segurança

Já configurados no `netlify.toml`:
- Content Security Policy
- X-Frame-Options
- X-XSS-Protection
- E outros headers importantes

## 📊 Passo 6: Monitoramento e Analytics

### 6.1 Netlify Analytics

1. No dashboard, vá para "Analytics"
2. Ative o Netlify Analytics (pode ter custo)
3. Monitore tráfego, performance e erros

### 6.2 Logs de Deploy

- Acesse "Deploys" para ver histórico
- Clique em qualquer deploy para ver logs detalhados
- Monitore erros de build e performance

## 🚨 Troubleshooting

### Problemas Comuns

#### Build Falha
```bash
# Teste localmente primeiro
npm run build

# Verifique se todas as dependências estão no package.json
npm install
```

#### Variáveis de Ambiente
- Certifique-se que começam com `VITE_`
- Verifique se estão configuradas no Netlify
- Redeploy após adicionar novas variáveis

#### Roteamento SPA
- O `netlify.toml` já configura redirecionamentos
- Todas as rotas apontam para `/index.html`

#### Supabase Connection
- Verifique URLs e chaves no Netlify
- Teste conexão local primeiro
- Verifique CORS no Supabase

## 📝 Comandos Úteis

```bash
# Deploy manual via Netlify CLI (opcional)
npm install -g netlify-cli
netlify login
netlify deploy --prod

# Testar build localmente
npm run build
npm run preview

# Verificar variáveis de ambiente
echo $VITE_SUPABASE_URL
```

## 🔄 Workflow de Desenvolvimento

### Desenvolvimento Local
```bash
git checkout -b feature/nova-funcionalidade
# Fazer mudanças
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### Deploy para Produção
```bash
git checkout main
git merge feature/nova-funcionalidade
git push origin main
# Deploy automático no Netlify!
```

## 📞 Suporte

### Links Úteis
- [Documentação Netlify](https://docs.netlify.com/)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router](https://reactrouter.com/)
- [Supabase Docs](https://supabase.com/docs)

### Checklist Final

- [ ] Repositório GitHub criado e conectado
- [ ] Site deployado no Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy automático funcionando
- [ ] Site acessível e funcional
- [ ] Supabase conectado corretamente
- [ ] Todas as funcionalidades testadas

**🎉 Parabéns! Seu sistema está no ar!**