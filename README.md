# Sistema de Distribuição de Itens da Guilda

Sistema web para gerenciar a distribuição de itens entre membros de uma guilda, usando Google Sheets como banco de dados e hospedado no Netlify.

## 🚀 Funcionalidades

- ✅ Gerenciamento de jogadores e itens
- ✅ Sistema de distribuição inteligente com rotação
- ✅ Histórico completo de distribuições
- ✅ Dashboard com estatísticas
- ✅ Tema claro/escuro
- ✅ Exportação/Importação de dados
- ✅ Integração com Google Sheets
- ✅ Deploy automático no Netlify

## 📋 Pré-requisitos

1. Conta no Google Cloud Platform
2. Conta no Netlify
3. Planilha do Google Sheets configurada

## 🛠️ Configuração

### 1. Google Cloud Platform

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Sheets:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Sheets API" e ative
4. Crie um Service Account:
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "Service Account"
   - Preencha os dados e clique em "Create"
   - Na aba "Keys", clique em "Add Key" > "Create New Key" > "JSON"
   - Baixe o arquivo JSON (você precisará dele depois)

### 2. Google Sheets

1. Crie uma nova planilha no Google Sheets
2. Crie as seguintes abas:
   - `Jogadores` - para armazenar dados dos jogadores
   - `Itens` - para armazenar dados dos itens
   - `Histórico` - para armazenar histórico de distribuições
   - `Configurações` - para configurações gerais
3. Compartilhe a planilha com o email do Service Account (encontrado no arquivo JSON baixado)
4. Copie o ID da planilha da URL (a parte entre `/d/` e `/edit`)

### 3. Netlify

1. Faça fork deste repositório
2. Conecte sua conta do Netlify ao GitHub
3. Crie um novo site a partir do seu fork
4. Configure as variáveis de ambiente no Netlify:
   - Vá para "Site Settings" > "Environment Variables"
   - Adicione as seguintes variáveis:
     ```
     GOOGLE_SPREADSHEET_ID=seu_id_da_planilha
     GOOGLE_SERVICE_ACCOUNT_KEY=conteudo_do_arquivo_json_em_uma_linha
     ```

## 🚀 Deploy

1. Faça push das suas alterações para o repositório
2. O Netlify fará o deploy automaticamente
3. Acesse sua URL do Netlify para testar

## 📁 Estrutura do Projeto

```
.
├── index.html              # Página principal
├── app.js                   # Lógica principal da aplicação
├── style.css               # Estilos CSS
├── netlify.toml            # Configurações do Netlify
├── src/
│   ├── config/
│   │   └── config.js       # Configurações da aplicação
│   └── services/
│       └── googleSheets.js # Serviço de integração com Google Sheets
└── netlify/
    └── functions/
        ├── package.json    # Dependências das funções
        └── sheets-api.js   # Função serverless para API
```

## 🔧 Desenvolvimento Local

1. Clone o repositório
2. Instale o Netlify CLI: `npm install -g netlify-cli`
3. Execute: `netlify dev`
4. Acesse `http://localhost:8888`

## 📊 Estrutura das Planilhas

### Aba "Jogadores"
| Nome | Item1 | Item2 | Item3 | Ativo | Faltas |
|------|-------|-------|-------|-------|--------|
| João | 5     | 3     | 2     | TRUE  | 0      |

### Aba "Itens"
| Nome           | Ativo |
|----------------|-------|
| Cristal do Caos| TRUE  |

### Aba "Histórico"
| Data | Jogador | Item | Quantidade | Observações |
|------|---------|------|------------|-------------|
| 2024-01-15 | João | Cristal | 1 | Distribuição automática |

## 🤝 Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se todas as variáveis de ambiente estão configuradas corretamente
2. Confirme se a planilha está compartilhada com o Service Account
3. Verifique os logs do Netlify Functions para erros
4. Abra uma issue neste repositório

## 🔄 Atualizações

Para atualizar o sistema:

1. Faça pull das últimas alterações
2. Verifique se há novas variáveis de ambiente necessárias
3. Faça push para trigger um novo deploy no Netlify
