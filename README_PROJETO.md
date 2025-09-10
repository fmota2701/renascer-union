# 🎮 Sistema de Distribuição de Itens - Renascer Union

Sistema moderno para gerenciamento e distribuição de itens de guilda com interface inspirada no design da Apple.

## 🌟 Características

- **Design Apple**: Interface elegante com glassmorphism e micro-interações
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Real-time**: Atualizações em tempo real via Supabase
- **Seguro**: Autenticação robusta e políticas de segurança
- **Moderno**: React 18, Vite, Styled Components

## 🚀 Demo

- **Admin Dashboard**: Gerenciamento completo de jogadores e itens
- **Player Dashboard**: Interface personalizada para cada jogador
- **Distribuição Inteligente**: Sistema automatizado de distribuição
- **Histórico Completo**: Rastreamento de todas as ações

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI moderna
- **Vite** - Build tool ultra-rápido
- **Styled Components** - CSS-in-JS com temas
- **React Router** - Navegação SPA
- **Lucide React** - Ícones modernos

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security** - Segurança granular
- **Real-time subscriptions** - Atualizações em tempo real

### Deploy
- **GitHub Pages** - Hospedagem gratuita
- **GitHub Actions** - CI/CD automatizado
- **Vite Build** - Otimização para produção

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no GitHub

### 1. Clone o Repositório
```bash
git clone https://github.com/SEU_USUARIO/sistema-distribuicao-itens.git
cd sistema-distribuicao-itens
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL do arquivo `ui/complete-supabase-schema.sql`
3. Configure as políticas RLS
4. Obtenha a URL e chave anônima

### 3. Configurar Ambiente

```bash
cd ui
cp .env.example .env.local
```

Edite `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Instalar Dependências

```bash
npm install
```

### 5. Executar Localmente

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 🚀 Deploy

### Método 1: Script Automatizado

```bash
# Deploy completo
./deploy.sh

# Deploy com limpeza de cache
./deploy.sh --clean
```

### Método 2: Manual

1. **Configurar GitHub**:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/sistema-distribuicao-itens.git
   git push -u origin main
   ```

2. **Configurar Secrets**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Ativar GitHub Pages**:
   - Settings → Pages → Source: GitHub Actions

### URLs de Produção
- **Site**: `https://SEU_USUARIO.github.io/sistema-distribuicao-itens/`
- **Admin**: `https://SEU_USUARIO.github.io/sistema-distribuicao-itens/#/admin`

## 📱 Como Usar

### Admin Dashboard
1. Acesse `/admin`
2. Faça login com credenciais de administrador
3. Gerencie jogadores, itens e distribuições
4. Monitore histórico e estatísticas

### Player Dashboard
1. Acesse `/player/NOME_DO_JOGADOR`
2. Visualize itens disponíveis
3. Faça seleções de itens
4. Acompanhe seu histórico

## 🎨 Personalização

### Temas
Edite `ui/src/styles/GlobalStyles.js`:

```javascript
const theme = {
  colors: {
    primary: '#8B0000',     // Cor principal
    background: '#0A0A0A',  // Fundo
    surface: '#1A1A1A',    // Superfícies
    // ...
  }
}
```

### Componentes
Todos os componentes estão em `ui/src/components/`:
- `AdminDashboard.jsx` - Painel administrativo
- `PlayerDashboard.jsx` - Painel do jogador
- `ItemCard.jsx` - Card de item
- `HistoryCard.jsx` - Card de histórico

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://projeto.supabase.co
VITE_SUPABASE_ANON_KEY=chave_anonima

# Opcional: Analytics
VITE_GA_TRACKING_ID=GA_TRACKING_ID

# Opcional: Sentry
VITE_SENTRY_DSN=SENTRY_DSN
```

### Build Customizado

Edite `ui/vite.config.js`:

```javascript
export default defineConfig({
  base: '/seu-repositorio/',
  build: {
    sourcemap: false,
    minify: 'terser',
    // ...
  }
})
```

## 📊 Monitoramento

### Performance
- Lighthouse CI integrado
- Bundle analyzer
- Core Web Vitals

### Erros
- Console logs removidos em produção
- Error boundaries implementados
- Fallbacks para componentes

### Analytics
- Google Analytics (opcional)
- Supabase Analytics
- GitHub Insights

## 🛡️ Segurança

### Supabase RLS
```sql
-- Exemplo de política
CREATE POLICY "Users can view own data" ON players
FOR SELECT USING (auth.uid() = user_id);
```

### Validação
- Validação client-side e server-side
- Sanitização de inputs
- Rate limiting via Supabase

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📚 Documentação

- [Deploy GitHub](./DEPLOY_GITHUB.md) - Guia completo de deploy
- [Supabase Setup](./SUPABASE_SETUP.md) - Configuração do backend
- [Componentes](./docs/components.md) - Documentação dos componentes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

### Problemas Comuns

**Erro de CORS**:
- Verifique a configuração do Supabase
- Confirme as URLs permitidas

**Build falha**:
- Limpe o cache: `npm run clean`
- Reinstale dependências: `rm -rf node_modules && npm install`

**Deploy não funciona**:
- Verifique as variáveis de ambiente
- Confirme as configurações do GitHub Pages

### Contato

- **Issues**: [GitHub Issues](https://github.com/SEU_USUARIO/sistema-distribuicao-itens/issues)
- **Discussões**: [GitHub Discussions](https://github.com/SEU_USUARIO/sistema-distribuicao-itens/discussions)

---

**Desenvolvido com ❤️ para a comunidade gaming**

*Sistema de Distribuição de Itens - Transformando a gestão de guildas com tecnologia moderna*