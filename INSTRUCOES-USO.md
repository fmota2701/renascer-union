# Sistema Renascer Union - Instruções de Uso

## Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com Node.js)
- Conta no Firebase (gratuita)

## Configuração Inicial

### 1. Instalação das Dependências

```bash
npm install
``` 

### 2. Configuração do Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative o Firestore Database
4. Ative a Authentication (opcional, para futuras melhorias)
5. Nas configurações do projeto, obtenha as credenciais
6. Copie o arquivo `.env.example` para `.env`
7. Preencha as variáveis no arquivo `.env` com suas credenciais do Firebase

### 3. Configuração das Credenciais de Administrador do Firebase

1. No Console do Firebase, vá em "Configurações do Projeto" > "Contas de Serviço"
2. Clique em "Gerar nova chave privada"
3. Salve o arquivo JSON baixado como `firebase-admin-key.json` na pasta raiz do projeto
4. **IMPORTANTE**: Nunca compartilhe este arquivo ou faça commit dele no Git

## Como Executar o Sistema

### Opção 1: Execução Completa (Recomendada)

```bash
# No Windows
StartRenascer.bat

# No Mac/Linux
./StartRenascer.sh
```

### Opção 2: Execução Manual

Abra 3 terminais diferentes:

**Terminal 1 - Servidor de Desenvolvimento:**
```bash
npm start
```

**Terminal 2 - Servidor JSON (Backup):**
```bash
npm run db
```

**Terminal 3 - Funções Netlify:**
```bash
npm run dev
```

## Acessando o Sistema

- **Página Principal**: http://localhost:8000
- **Login**: http://localhost:8000/login.html
- **Dashboard Admin**: http://localhost:8000/admin.html
- **Dashboard Jogador**: http://localhost:8000/player.html

## Credenciais Padrão

### Administrador
- **Usuário**: admin
- **Senha**: admin123

### Jogadores de Exemplo
- **Usuário**: player1 | **Senha**: pass1
- **Usuário**: player2 | **Senha**: pass2

## Funcionalidades Principais

### Para Administradores
- Gerenciar jogadores (adicionar, editar, remover)
- Gerenciar itens do jogo
- Distribuir itens para jogadores
- Visualizar estatísticas e relatórios
- Controlar participações diárias

### Para Jogadores
- Visualizar itens recebidos
- Acompanhar histórico de participações
- Ver estatísticas pessoais
- Confirmar participação em eventos

## Estrutura de Dados

O sistema utiliza Firebase Firestore com as seguintes coleções:
- `players`: Dados dos jogadores
- `items`: Itens do jogo
- `distributions`: Histórico de distribuições
- `participations`: Registro de participações

## Backup e Migração

### Migrar dados do db.json para Firebase
```bash
node migrate-to-firebase.js
```

### Backup dos dados
Os dados ficam salvos no Firebase Firestore e podem ser exportados pelo console do Firebase.

## Solução de Problemas

### Erro de Conexão com Firebase
1. Verifique se as credenciais no `.env` estão corretas
2. Confirme se o Firestore está ativado no projeto Firebase
3. Verifique se o arquivo `firebase-admin-key.json` está na pasta raiz

### Porta já em uso
- Mude as portas nos arquivos `package.json` se necessário
- Verifique se não há outros serviços rodando nas portas 8000, 3001 ou 8888

### Problemas de Permissão
- No Mac/Linux, torne o script executável: `chmod +x StartRenascer.sh`

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs no terminal
2. Consulte a documentação do Firebase
3. Verifique se todas as dependências foram instaladas corretamente

## Segurança

- **NUNCA** compartilhe o arquivo `firebase-admin-key.json`
- **NUNCA** faça commit do arquivo `.env` com credenciais reais
- Use senhas fortes em produção
- Configure regras de segurança adequadas no Firestore para produção

---

**Sistema desenvolvido para gerenciamento de distribuição de itens e participações em jogos online.**