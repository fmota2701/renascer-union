# 🔐 Variáveis de Ambiente - Netlify

## 📋 Variáveis Necessárias

Configure estas variáveis no Netlify Dashboard:

### 🔑 Supabase (OBRIGATÓRIAS)
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 📱 Aplicação (OPCIONAIS)
```
VITE_APP_NAME=Sistema de Itens
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Sistema de gerenciamento de itens
```

### 🌍 Ambiente (AUTOMÁTICAS)
```
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

## 🚀 Como Configurar no Netlify

### Passo 1: Acessar Configurações
1. Acesse seu site no Netlify Dashboard
2. Vá para **"Site settings"**
3. Clique em **"Environment variables"**

### Passo 2: Adicionar Variáveis
Para cada variável:
1. Clique **"Add variable"**
2. **Key**: Nome da variável (ex: `VITE_SUPABASE_URL`)
3. **Value**: Valor da variável
4. **Scopes**: Deixe marcado "Production" e "Deploy previews"
5. Clique **"Create variable"**

## 🔍 Onde Encontrar os Valores do Supabase

### VITE_SUPABASE_URL
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **Settings** → **API**
4. Copie a **"Project URL"**

### VITE_SUPABASE_ANON_KEY
1. Na mesma página (Settings → API)
2. Copie a **"anon public"** key
3. ⚠️ **NÃO** use a service_role key!

## ✅ Checklist de Configuração

- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada
- [ ] `VITE_APP_NAME` configurada (opcional)
- [ ] `VITE_APP_VERSION` configurada (opcional)
- [ ] Todas as variáveis salvas no Netlify
- [ ] Deploy realizado após configuração

## 🔄 Após Configurar

1. **Redeploy**: Netlify fará deploy automático
2. **Teste**: Acesse o site e teste login/funcionalidades
3. **Logs**: Verifique logs de deploy se houver erro

## 🚨 Troubleshooting

### Site não conecta ao Supabase
- ✅ Verifique se as URLs estão corretas
- ✅ Confirme que as chaves são válidas
- ✅ Teste as variáveis localmente primeiro

### Erro de CORS
- ✅ Configure CORS no Supabase para o domínio Netlify
- ✅ Adicione `*.netlify.app` nas origens permitidas

### Build falha
- ✅ Verifique se todas as variáveis começam com `VITE_`
- ✅ Confirme que não há caracteres especiais
- ✅ Teste build local: `npm run build`

## 📝 Exemplo Completo

```env
# Supabase
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
VITE_APP_NAME=Sistema de Itens
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Sistema de gerenciamento de itens
```

---

**🎯 Objetivo**: Site funcionando 100% no Netlify com Supabase!