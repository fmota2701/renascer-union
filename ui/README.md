# Sistema de Itens - React/Vite

Sistema de gerenciamento de itens migrado para React com Vite, mantendo toda a lógica original do sistema HTML/JS.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca para interfaces de usuário
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Styled Components** - Estilização CSS-in-JS
- **Supabase** - Backend e banco de dados
- **Lucide React** - Ícones
- **Date-fns** - Manipulação de datas
- **Context API** - Gerenciamento de estado global

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/
│   │   └── Login.jsx
│   ├── admin/
│   │   └── AdminDashboard.jsx
│   ├── player/
│   │   └── PlayerDashboard.jsx
│   └── common/
│       ├── Header.jsx
│       └── Loading.jsx
├── contexts/
│   └── AppContext.jsx
├── services/
│   └── supabase.js
├── styles/
│   └── GlobalStyles.js
├── hooks/
├── utils/
└── types/
```

## 🎯 Funcionalidades

### Para Administradores
- ✅ Gerenciamento completo de jogadores
- ✅ Gerenciamento de itens (CRUD)
- ✅ Visualização do histórico de ações
- ✅ Controle de disponibilidade de itens
- ✅ Dashboard com estatísticas

### Para Jogadores
- ✅ Visualização de itens disponíveis
- ✅ Seleção/deseleção de itens desejados
- ✅ Filtros por tipo, raridade e disponibilidade
- ✅ Busca por nome de item
- ✅ Visualização das próprias seleções
- ✅ Dashboard personalizado

### Recursos Gerais
- ✅ Autenticação com papéis (admin/player)
- ✅ Tema dark red mantido do sistema original
- ✅ Sincronização em tempo real com Supabase
- ✅ Interface responsiva
- ✅ Roteamento protegido
- ✅ Estados de carregamento
- ✅ Tratamento de erros

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- Conta no Supabase configurada

### Passos

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

3. **Executar em desenvolvimento:**
   ```bash
   npm run dev
   ```
   
   A aplicação estará disponível em `http://localhost:3000`

4. **Build para produção:**
   ```bash
   npm run build
   ```

## 🔄 Migração Realizada

### Do Sistema Original HTML/JS:
- ✅ Toda lógica JavaScript convertida para React hooks
- ✅ HTML convertido para componentes JSX
- ✅ CSS convertido para styled-components
- ✅ Integração com Supabase mantida
- ✅ Funcionalidades preservadas 100%
- ✅ Interface melhorada com componentes reutilizáveis
- ✅ Roteamento implementado
- ✅ Estado global com Context API

### Melhorias Implementadas:
- 🎯 Componentização modular
- 🎯 Roteamento com React Router
- 🎯 Estado global centralizado
- 🎯 Melhor tratamento de erros
- 🎯 Loading states aprimorados
- 🎯 Interface mais responsiva
- 🎯 Código mais maintível

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
