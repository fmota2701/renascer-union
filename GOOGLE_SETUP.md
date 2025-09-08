# 🔧 Configuração do Google Sheets para Produção

## ✅ Status Atual
- ✅ Sistema deployado no Netlify: **https://renascer-union.netlify.app**
- ✅ Variáveis de ambiente configuradas (com valores temporários)
- ⚠️ **AÇÃO NECESSÁRIA**: Configurar credenciais reais do Google

## 📋 Passos para Configurar o Google Sheets

### 1. Criar Service Account no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services > Credentials**
4. Clique em **Create Credentials > Service Account**
5. Preencha os dados e clique em **Create**
6. Na aba **Keys**, clique em **Add Key > Create New Key**
7. Escolha **JSON** e baixe o arquivo

### 2. Habilitar APIs Necessárias

1. No Google Cloud Console, vá em **APIs & Services > Library**
2. Procure e habilite:
   - **Google Sheets API**
   - **Google Drive API**

### 3. Configurar Permissões na Planilha

1. Abra sua planilha do Google Sheets
2. Clique em **Share** (Compartilhar)
3. Adicione o email do Service Account (encontrado no arquivo JSON)
4. Dê permissão de **Editor**

### 4. Atualizar Variáveis no Netlify

1. Acesse [Netlify Dashboard](https://app.netlify.com/projects/renascer-union)
2. Vá em **Site Settings > Environment Variables**
3. Atualize as variáveis:

```bash
# ID da sua planilha (da URL)
GOOGLE_SPREADSHEET_ID=1BH-ywrx9BdBvyakidD0aOCTBx_9AbC-xxxx

# Conteúdo do arquivo JSON (em uma linha)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"seu-projeto",...}
```

### 5. Fazer Redeploy

Após configurar as credenciais:
```bash
git commit --allow-empty -m "Trigger redeploy after env vars update"
git push origin main
```

## 🔗 Links Importantes

- **Site em Produção**: https://renascer-union.netlify.app
- **Admin Netlify**: https://app.netlify.com/projects/renascer-union
- **Repositório GitHub**: https://github.com/fmota2701/renascer-union

## 🚨 Importante

- As credenciais atuais são temporárias e não funcionarão
- O sistema funcionará localmente até as credenciais serem configuradas
- Após configurar, outras pessoas poderão acessar e ver os dados em tempo real

## 📞 Suporte

Se precisar de ajuda, verifique:
1. Se as APIs estão habilitadas no Google Cloud
2. Se o Service Account tem acesso à planilha
3. Se as variáveis de ambiente estão corretas no Netlify
4. Os logs de deploy no Netlify para erros específicos