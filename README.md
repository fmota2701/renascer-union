# Sistema de Distribuição Renascer Union

## Deploy no Netlify

Este guia mostra como fazer o deploy do sistema de distribuição de itens no Netlify para mantê-lo online 24 horas por dia.

### Pré-requisitos
1. Conta no [Netlify](https://netlify.com)
2. Repositório Git (GitHub, GitLab, etc.)
3. Git instalado localmente

### Passos para Deploy

1. **Preparar o repositório**
   ```bash
   # Se ainda não inicializou o Git
   git init
   git add .
   git commit -m "Initial commit"
   
   # Conectar ao repositório remoto
   git remote add origin https://github.com/seu-usuario/seu-repositorio.git
   git push -u origin main
   ```

2. **Deploy no Netlify**
   - Acesse [netlify.com](https://netlify.com) e faça login
   - Clique em "New site from Git"
   - Conecte sua conta do GitHub/GitLab
   - Selecione o repositório do projeto
   - Configure as opções de build:
     - **Build command**: `npm install`
     - **Publish directory**: `.` (ponto)
   - Clique em "Deploy site"

3. **Configuração Automática**
   O Netlify irá:
   - Detectar automaticamente o `netlify.toml`
   - Configurar as funções serverless
   - Configurar os redirects para a API
   - Gerar uma URL pública (ex: `https://seu-site.netlify.app`)

#### URLs da Aplicação
- **Site principal**: `https://seu-site.netlify.app`
- **Painel admin**: `https://seu-site.netlify.app/admin.html`
- **Distribuição**: `https://seu-site.netlify.app/distribuicao.html`
- **API**: `https://seu-site.netlify.app/api/players`

#### Vantagens do Netlify
- Deploy automático a cada push
- CDN global integrado
- HTTPS automático
- Funções serverless incluídas
- Interface amigável
- Boa performance para sites estáticos

### Estrutura do Projeto

```
renascer-union/
├── netlify.toml              # Configuração do Netlify
├── _redirects               # Redirects (backup)
├── netlify/functions/api.js # Função serverless da API
├── package.json            # Configuração do projeto
├── db.json                 # Banco de dados JSON
├── index.html              # Página inicial
├── admin.html              # Painel administrativo
├── distribuicao.html       # Sistema de distribuição
├── login.html              # Página de login
├── player.html             # Página do jogador
├── itens.html              # Gerenciamento de itens
├── *.js                    # Scripts JavaScript
├── *.css                   # Arquivos de estilo
└── README.md               # Este arquivo
```

### Desenvolvimento Local

```bash
# Testar localmente
npm run dev

# Acessar em http://localhost:8000
```

### Monitoramento

- Logs de função disponíveis no painel do Netlify
- Métricas de uso e performance
- Deploy automático a cada push
- SSL/HTTPS automático
- CDN global integrado

### Backup do Banco de Dados

O arquivo `db.json` contém todos os dados:
1. Faça backup regular via Git
2. Baixe o arquivo periodicamente
3. Use controle de versão para histórico

### Custos

- **Netlify**: Plano gratuito com 100GB/mês de largura de banda
- **Funções**: 125.000 invocações/mês no plano gratuito
- **Deploy**: Ilimitados no plano gratuito
- **Banco de dados**: Arquivo JSON (sem custos adicionais)

### Limitações

- Funções serverless têm timeout de 10 segundos
- Banco de dados em arquivo (adequado para projetos pequenos/médios)
- Armazenamento limitado a arquivos estáticos

### Suporte

Para dúvidas ou problemas:
1. Verifique os logs de função no painel do Netlify
2. Consulte a [documentação do Netlify](https://docs.netlify.com)
3. Verifique os logs de deploy
4. Entre em contato com o desenvolvedor