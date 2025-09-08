# Sistema de Loot de Guilda - Versão Online

## 🚀 Funcionalidades

### ✅ Sistema Completo de Loot
- Gerenciamento de jogadores e classes
- Sistema de sugestões inteligentes
- Distribuição automática de loot
- Histórico e estatísticas

### ✅ Otimizações de Performance
- Lazy loading para tabelas grandes
- Cache inteligente com invalidação automática
- Algoritmos otimizados de sugestão
- Busca em tempo real com debounce

### ✅ Funcionalidades Avançadas
- Atalhos de teclado (Ctrl+S, Ctrl+E, etc.)
- Sistema de notificações não-intrusivas
- Drag-and-drop para reordenação
- Modo offline com sincronização automática

### 🌐 **NOVO: Sistema Online em Tempo Real**
- **Servidor Node.js** com Express e Socket.io
- **Banco de dados SQLite** para persistência
- **Sincronização em tempo real** entre múltiplos usuários
- **API REST** para operações CRUD
- **WebSocket** para atualizações instantâneas
- **Fallback offline** quando servidor não disponível

## 🛠️ Instalação e Uso

### Modo Local (Desenvolvimento)

1. **Instalar dependências do backend:**
   ```bash
   cd backend
   npm install
   ```

2. **Iniciar servidor:**
   ```bash
   npm start
   ```
   O servidor estará disponível em: `http://localhost:3001`

3. **Acessar aplicação:**
   Abra o navegador e acesse `http://localhost:3001`

## 🚀 Deploy no Vercel

### ✅ Configuração Pronta

O projeto já está **100% configurado** para deploy no Vercel:

- ✅ `vercel.json` otimizado
- ✅ `package.json` na raiz
- ✅ Estrutura de arquivos correta
- ✅ Detecção automática de ambiente
- ✅ Fallback para polling quando WebSocket não disponível

### 🚀 Deploy Rápido

**Método 1: Interface Web (Mais Fácil)**
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte seu repositório Git
3. Clique em "Deploy"
4. ✨ Pronto! Seu sistema estará online

**Método 2: CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 📋 Instruções Detalhadas

Para instruções completas, consulte: [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md)

### ⚠️ Importante para Produção

**Banco de Dados**: SQLite não persiste no Vercel. Para produção, recomendamos:
- **PlanetScale** (MySQL gratuito)
- **Supabase** (PostgreSQL gratuito)
- **MongoDB Atlas** (MongoDB gratuito)

**WebSocket**: Funciona com polling automático no Vercel

### Deploy no Heroku (Alternativa)

1. **Criar arquivo Procfile:**
   ```
   web: node backend/server.js
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   heroku config:set NODE_ENV=production
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy sistema online"
   git push heroku main
   ```

## 📡 API Endpoints

### Dados da Guilda
- `GET /api/guild-data` - Buscar todos os dados
- `POST /api/guild-data` - Salvar dados completos

### Jogadores
- `GET /api/players` - Listar jogadores
- `POST /api/players` - Adicionar jogador
- `PUT /api/players/:id` - Atualizar jogador
- `DELETE /api/players/:id` - Remover jogador

### WebSocket Events
- `request-initial-data` - Solicitar dados iniciais
- `update-data` - Atualizar dados
- `data-updated` - Dados atualizados (broadcast)
- `player-added` - Jogador adicionado (broadcast)
- `player-updated` - Jogador atualizado (broadcast)
- `player-deleted` - Jogador removido (broadcast)

## 🔧 Configuração

### Variáveis de Ambiente
- `PORT` - Porta do servidor (padrão: 3001)
- `NODE_ENV` - Ambiente (development/production)

### Banco de Dados
O sistema usa SQLite por padrão, criando automaticamente:
- `backend/guild_loot.db` - Arquivo do banco de dados
- Tabelas: `players`, `guild_data`, `logs`

## 🌟 Recursos Online

### Sincronização em Tempo Real
- Múltiplos usuários podem acessar simultaneamente
- Atualizações instantâneas via WebSocket
- Notificações quando outros usuários fazem alterações

### Modo Híbrido
- Funciona online e offline
- Dados salvos localmente como backup
- Sincronização automática quando conexão é restaurada

### Indicador de Status
- Mostra status de conexão (Online/Offline)
- Feedback visual para operações
- Notificações de erro e sucesso

## 🔒 Segurança

- CORS configurado para múltiplas origens
- Validação de dados no servidor
- Tratamento de erros robusto
- Logs de auditoria para todas as operações

## 📱 Compatibilidade

- **Navegadores:** Chrome, Firefox, Safari, Edge (versões recentes)
- **Dispositivos:** Desktop, tablet, mobile
- **Redes:** Funciona em redes locais e internet

## 🚀 Performance

- **WebSocket** para comunicação eficiente
- **Cache inteligente** no frontend
- **Lazy loading** para grandes volumes de dados
- **Debounce** em operações de busca
- **Compressão** automática no servidor

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor no terminal
2. Abra o console do navegador (F12)
3. Verifique a conectividade de rede
4. Reinicie o servidor se necessário

---

**Sistema de Loot de Guilda** - Agora com sincronização em tempo real! 🎮✨
