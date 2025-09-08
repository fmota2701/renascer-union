# 🚀 Deploy no Vercel - Sistema de Loot de Guilda

## Pré-requisitos

1. **Conta no Vercel**: Crie uma conta gratuita em [vercel.com](https://vercel.com)
2. **Git Repository**: Seu código deve estar em um repositório Git (GitHub, GitLab, etc.)
3. **Vercel CLI** (opcional): `npm i -g vercel`

## 📋 Passos para Deploy

### Método 1: Via Interface Web (Recomendado)

1. **Acesse o Vercel Dashboard**
   - Vá para [vercel.com/dashboard](https://vercel.com/dashboard)
   - Faça login com sua conta

2. **Importe o Projeto**
   - Clique em "New Project"
   - Conecte seu repositório Git
   - Selecione o repositório do projeto

3. **Configurações do Deploy**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `./`
   - **Install Command**: `npm install`

4. **Variáveis de Ambiente**
   - Adicione as seguintes variáveis:
   ```
   NODE_ENV=production
   ```

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde o processo de build e deploy

### Método 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy do projeto
vercel

# Seguir as instruções interativas
# - Set up and deploy? [Y/n] Y
# - Which scope? Selecione sua conta
# - Link to existing project? [y/N] N
# - What's your project's name? guild-loot-system
# - In which directory is your code located? ./
```

## ⚙️ Configurações Importantes

### Arquivos de Configuração

- ✅ `vercel.json` - Já configurado
- ✅ `package.json` - Já criado na raiz
- ✅ `.gitignore` - Já configurado

### Estrutura do Projeto

```
.
├── backend/           # Servidor Node.js
│   ├── server.js      # Arquivo principal
│   ├── database.js    # Banco de dados
│   └── package.json   # Dependências do backend
├── index.html         # Frontend
├── app.js            # Lógica do frontend
├── realtime-client.js # Cliente WebSocket
├── style.css         # Estilos
├── vercel.json       # Configuração do Vercel
└── package.json      # Dependências principais
```

## 🔧 Funcionalidades no Vercel

### ✅ Suportado
- ✅ **Servidor Express** (via Serverless Functions)
- ✅ **API REST** endpoints
- ✅ **Arquivos estáticos** (HTML, CSS, JS)
- ✅ **Banco SQLite** (temporário por request)
- ✅ **Variáveis de ambiente**

### ⚠️ Limitações
- ⚠️ **WebSocket**: Limitado no Vercel (usar polling como fallback)
- ⚠️ **SQLite**: Dados não persistem entre requests (usar banco externo)
- ⚠️ **Sessões**: Não persistem (usar Redis ou banco externo)

## 🗄️ Banco de Dados em Produção

### Opções Recomendadas

1. **PlanetScale** (MySQL)
   ```bash
   npm install @planetscale/database
   ```

2. **Supabase** (PostgreSQL)
   ```bash
   npm install @supabase/supabase-js
   ```

3. **MongoDB Atlas**
   ```bash
   npm install mongodb
   ```

### Configuração de Variáveis

Adicione no Vercel Dashboard:
```
DATABASE_URL=sua_url_do_banco
DATABASE_TOKEN=seu_token (se necessário)
```

## 🌐 WebSocket em Produção

### Alternativas para WebSocket

1. **Socket.io com Polling**
   - Já configurado no projeto
   - Funciona automaticamente como fallback

2. **Pusher** (Recomendado)
   ```bash
   npm install pusher pusher-js
   ```

3. **Ably**
   ```bash
   npm install ably
   ```

## 📝 Checklist de Deploy

- [ ] Código commitado no Git
- [ ] Repositório público ou privado acessível
- [ ] Conta no Vercel criada
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados externo configurado (se necessário)
- [ ] Teste local funcionando
- [ ] Deploy realizado
- [ ] Teste em produção

## 🚨 Troubleshooting

### Erro: "Function Timeout"
- Aumente o `maxDuration` no `vercel.json`
- Otimize consultas ao banco

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente

### WebSocket não funciona
- Verifique se o polling está habilitado
- Considere usar serviço externo (Pusher/Ably)

### Banco de dados não persiste
- SQLite não persiste no Vercel
- Use banco externo (PlanetScale, Supabase, etc.)

## 📞 Suporte

- **Documentação Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Comunidade**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Status**: [vercel-status.com](https://vercel-status.com)

---

**🎉 Após o deploy, seu sistema estará disponível em uma URL como:**
`https://guild-loot-system-xxx.vercel.app`