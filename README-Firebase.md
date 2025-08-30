# Configuração do Firebase

Este guia explica como configurar o Firebase para o projeto Renascer Union.

## 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "renascer-union")
4. Configure o Google Analytics (opcional)
5. Clique em "Criar projeto"

## 2. Configurar Firestore Database

1. No painel do Firebase, vá em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de teste" (por enquanto)
4. Selecione a localização (recomendado: southamerica-east1)
5. Clique em "Concluído"

## 3. Configurar Authentication (Opcional)

1. Vá em "Authentication" > "Sign-in method"
2. Habilite os métodos desejados (Email/Password recomendado)

## 4. Obter Credenciais Web App

1. Vá em "Configurações do projeto" (ícone de engrenagem)
2. Na aba "Geral", role até "Seus apps"
3. Clique no ícone "</>"
4. Digite um nome para o app (ex: "renascer-web")
5. Marque "Configurar também o Firebase Hosting"
6. Clique em "Registrar app"
7. Copie as configurações mostradas

## 5. Obter Credenciais Admin SDK

1. Vá em "Configurações do projeto" > "Contas de serviço"
2. Clique em "Gerar nova chave privada"
3. Baixe o arquivo JSON
4. Guarde o arquivo em local seguro

## 6. Configurar Variáveis de Ambiente

### Para desenvolvimento local:

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Preencha as variáveis no arquivo `.env`:
   ```env
   FIREBASE_PROJECT_ID=seu-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua chave privada aqui\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project-id.iam.gserviceaccount.com
   FIREBASE_API_KEY=sua-api-key
   FIREBASE_AUTH_DOMAIN=seu-project.firebaseapp.com
   FIREBASE_STORAGE_BUCKET=seu-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=seu-app-id
   ```

### Para produção (Netlify):

1. Acesse o painel do Netlify
2. Vá em "Site settings" > "Environment variables"
3. Adicione todas as variáveis do arquivo `.env`

**Importante**: Para a `FIREBASE_PRIVATE_KEY`, certifique-se de incluir as quebras de linha como `\n`

## 7. Atualizar Configuração do Frontend

Edite o arquivo `firebase-config.js` com suas credenciais:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-project.firebaseapp.com",
  projectId: "seu-project-id",
  storageBucket: "seu-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

## 8. Configurar Regras de Segurança

No Firestore, vá em "Regras" e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita para todas as coleções (temporário)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Nota**: Estas regras são muito permissivas. Em produção, configure regras mais restritivas.

## 9. Migrar Dados

Após configurar as credenciais, execute:

```bash
node migrate-to-firebase.js
```

## 10. Testar a Integração

1. Inicie o servidor local:
   ```bash
   npm start
   ```

2. Acesse `http://localhost:8000`
3. Teste as funcionalidades de CRUD
4. Verifique os dados no Firebase Console

## Estrutura das Coleções

### players
```json
{
  "id": "string",
  "nick": "string",
  "class": "string",
  "level": "number",
  "createdAt": "timestamp",
  "order": "number"
}
```

### items
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "order": "number"
}
```

### distribution
```json
{
  "id": "string",
  "playerId": "string",
  "itemId": "string",
  "quantity": "number",
  "createdAt": "timestamp"
}
```

## Troubleshooting

### Erro "Invalid PEM formatted message"
- Verifique se a `FIREBASE_PRIVATE_KEY` está corretamente formatada
- Certifique-se de incluir as aspas duplas e quebras de linha `\n`

### Erro "Permission denied"
- Verifique as regras de segurança do Firestore
- Confirme se as credenciais estão corretas

### Erro "Project not found"
- Verifique se o `FIREBASE_PROJECT_ID` está correto
- Confirme se o projeto existe no Firebase Console

## Custos

- **Firestore**: Plano gratuito inclui 50.000 leituras/dia
- **Functions**: Plano gratuito inclui 125.000 invocações/mês
- **Hosting**: Plano gratuito inclui 10GB de armazenamento

Para projetos pequenos/médios, o plano gratuito é suficiente.