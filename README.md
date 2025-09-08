# Sistema de Distribuição de Itens da Guilda

Sistema web para gerenciar a distribuição de itens entre membros de uma guilda, usando Supabase como banco de dados e hospedado no Netlify.

## 🚀 Funcionalidades

- ✅ Gerenciamento de jogadores e itens
- ✅ Sistema de distribuição inteligente com rotação
- ✅ Histórico completo de distribuições
- ✅ Dashboard com estatísticas
- ✅ Tema claro/escuro
- ✅ Exportação/Importação de dados
- ✅ Integração com Supabase
- ✅ Deploy automático no Netlify

## 📋 Pré-requisitos

1. Conta no Supabase
2. Conta no Netlify

## 🛠️ Configuração

### 1. Supabase

1. Acesse o [Supabase](https://supabase.com/)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Vá para Settings > API para obter:
   - Project URL
   - Anon public key
   - Service role key (para operações administrativas)
5. Execute o script de criação das tabelas (disponível em `supabase-schema.sql`)

### 2. Netlify

1. Faça fork deste repositório
2. Conecte sua conta do Netlify ao GitHub
3. Crie um novo site a partir do seu fork
4. Configure as variáveis de ambiente no Netlify:
   - Vá para "Site Settings" > "Environment Variables"
   - Adicione as seguintes variáveis:
     ```
     SUPABASE_URL=sua_url_do_supabase
     SUPABASE_ANON_KEY=sua_chave_publica_do_supabase
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
├── supabase-api.js         # Serviço de integração com Supabase
├── supabase-schema.sql     # Schema das tabelas do Supabase
└── SUPABASE_SETUP.md       # Guia de configuração do Supabase
```

## 🔧 Desenvolvimento Local

1. Clone o repositório
2. Instale o Netlify CLI: `npm install -g netlify-cli`
3. Execute: `netlify dev`
4. Acesse `http://localhost:8888`

## 📊 Estrutura do Banco de Dados

### Tabela "players"
| id | name | active | faults | created_at | updated_at |
|----|------|--------|--------|------------|------------|
| 1  | João | true   | 0      | timestamp  | timestamp  |

### Tabela "items"
| id | name | created_at |
|----|------|------------|
| 1  | Cristal do Caos | timestamp |

### Tabela "distributions"
| id | player_name | item_name | quantity | distributed_at |
|----|-------------|-----------|----------|----------------|
| 1  | João        | Cristal   | 1        | timestamp      |



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
2. Confirme se as tabelas do Supabase foram criadas corretamente
3. Verifique os logs do Netlify para erros
4. Abra uma issue neste repositório

## 🔄 Atualizações

Para atualizar o sistema:

1. Faça pull das últimas alterações
2. Verifique se há novas variáveis de ambiente necessárias
3. Faça push para trigger um novo deploy no Netlify
