# 🚀 Guia de Migração para Supabase

## 📋 Passo 1: Criar Conta e Projeto no Supabase

1. **Acesse**: https://supabase.com
2. **Clique em "Start your project"**
3. **Faça login** com GitHub, Google ou email
4. **Crie um novo projeto**:
   - Nome: `renascer-items-system`
   - Senha do banco: **ANOTE ESTA SENHA!**
   - Região: `South America (São Paulo)` para melhor latência

## 📊 Passo 2: Configurar o Banco de Dados

1. **No painel do Supabase**, vá em **"SQL Editor"**
2. **Cole todo o conteúdo** do arquivo `supabase-schema.sql`
3. **Execute o script** clicando em "Run"
4. **Verifique** se todas as tabelas foram criadas em **"Table Editor"**

## 🔑 Passo 3: Obter Credenciais

1. Vá em **"Settings" > "API"**
2. **Anote estas informações**:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ **SECRETA!**

## 📦 Passo 4: Instalar Dependências

```bash
# No diretório netlify/functions/
cd netlify/functions
npm install @supabase/supabase-js
```

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

Crie/atualize o arquivo `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Sheets (manter temporariamente para migração)
GOOGLE_SHEETS_ID=sua_planilha_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu_email
GOOGLE_PRIVATE_KEY=sua_chave
```

## 🔄 Passo 6: Migrar Dados Existentes

1. **Execute o script de migração** (será criado no próximo passo)
2. **Verifique os dados** no Supabase Table Editor
3. **Teste as operações** básicas

## 🧪 Passo 7: Testar Nova API

1. **Atualize a API** para usar Supabase
2. **Teste todos os endpoints**:
   - GET `/players` - Listar jogadores
   - GET `/items` - Listar itens
   - GET `/history` - Histórico
   - POST `/distribute` - Distribuir itens
   - POST `/sync` - Sincronização

## 📈 Passo 8: Monitorar Performance

1. **Compare tempos de resposta**:
   - Google Sheets: 15+ segundos
   - Supabase: <1 segundo esperado

2. **Verifique logs** no Supabase Dashboard
3. **Monitore uso** de recursos no plano gratuito

## ✅ Checklist de Migração

- [ ] Conta Supabase criada
- [ ] Projeto configurado
- [ ] Schema executado
- [ ] Credenciais anotadas
- [ ] Dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Dados migrados
- [ ] API atualizada
- [ ] Testes realizados
- [ ] Performance verificada

## 🆘 Troubleshooting

### Erro de Conexão
- Verifique URL e chaves
- Confirme que RLS está configurado corretamente

### Dados não aparecem
- Verifique políticas RLS
- Confirme que a migração foi executada

### Performance lenta
- Verifique índices criados
- Monitore queries no Supabase

## 📊 Benefícios Esperados

✅ **Performance**: 50x mais rápido  
✅ **Confiabilidade**: Zero rate limiting  
✅ **Escalabilidade**: Suporta muito mais usuários  
✅ **Recursos**: Real-time, backup automático  
✅ **Custo**: Gratuito para seu uso  

---

**Próximo passo**: Executar a migração dos dados!