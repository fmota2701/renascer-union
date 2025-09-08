# Configuração do Netlify - Passo a Passo

## 1. Preparação dos Arquivos

Antes de fazer o deploy, certifique-se de que você tem:

- ✅ Conta no Google Cloud Platform
- ✅ Service Account criado com acesso à API do Google Sheets
- ✅ Arquivo JSON do Service Account baixado
- ✅ Planilha do Google Sheets criada e compartilhada com o Service Account
- ✅ ID da planilha copiado

## 2. Deploy no Netlify

### Opção A: Deploy via Git (Recomendado)

1. **Faça push do código para um repositório Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Guild Loot Distribution System"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/seu-repositorio.git
   git push -u origin main
   ```

2. **Conecte o Netlify ao seu repositório:**
   - Acesse [netlify.com](https://netlify.com) e faça login
   - Clique em "New site from Git"
   - Escolha seu provedor Git (GitHub, GitLab, etc.)
   - Selecione o repositório
   - Configure as opções de build:
     - **Build command:** (deixe vazio)
     - **Publish directory:** (deixe vazio ou coloque ".")
   - Clique em "Deploy site"

### Opção B: Deploy Manual

1. **Comprima todos os arquivos em um ZIP:**
   - Selecione todos os arquivos do projeto
   - Crie um arquivo ZIP

2. **Faça upload no Netlify:**
   - Acesse [netlify.com](https://netlify.com)
   - Arraste o arquivo ZIP para a área "Deploy manually"

## 3. Configurar Variáveis de Ambiente

1. **Acesse as configurações do site:**
   - No dashboard do Netlify, clique no seu site
   - Vá para "Site settings"
   - Clique em "Environment variables" no menu lateral

2. **Adicione as variáveis necessárias:**

   **GOOGLE_SPREADSHEET_ID**
   - Key: `GOOGLE_SPREADSHEET_ID`
   - Value: `1ABC123DEF456GHI789JKL` (o ID da sua planilha)
   
   **GOOGLE_SERVICE_ACCOUNT_KEY**
   - Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: Todo o conteúdo do arquivo JSON do Service Account em uma única linha
   
   Exemplo do JSON (remova quebras de linha):
   ```json
   {"type":"service_account","project_id":"seu-projeto","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n","client_email":"seu-service@seu-projeto.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/seu-service%40seu-projeto.iam.gserviceaccount.com"}
   ```

3. **Clique em "Save" para cada variável**

## 4. Verificar o Deploy

1. **Aguarde o build terminar:**
   - Vá para a aba "Deploys"
   - Aguarde o status ficar "Published"

2. **Teste o site:**
   - Clique no link do seu site (ex: `https://amazing-site-123456.netlify.app`)
   - Verifique se a página carrega corretamente
   - Teste as funcionalidades básicas

## 5. Configurar Domínio Personalizado (Opcional)

1. **Adicionar domínio:**
   - Vá para "Site settings" > "Domain management"
   - Clique em "Add custom domain"
   - Digite seu domínio (ex: `minha-guilda.com`)

2. **Configurar DNS:**
   - No seu provedor de domínio, configure:
     - Tipo A: `185.199.108.153`
     - Tipo A: `185.199.109.153`
     - Tipo A: `185.199.110.153`
     - Tipo A: `185.199.111.153`
   - Ou configure CNAME para `seu-site.netlify.app`

3. **Aguardar propagação:**
   - Pode levar até 24 horas para o DNS propagar

## 6. Configurar HTTPS

- O Netlify configura HTTPS automaticamente
- Aguarde alguns minutos após o deploy
- Verifique se o certificado SSL está ativo

## 7. Testar Integração com Google Sheets

1. **Abra o console do navegador (F12)**
2. **Teste as funcionalidades:**
   - Adicione um jogador
   - Adicione um item
   - Faça uma distribuição
   - Verifique se os dados aparecem na planilha

## 8. Solução de Problemas

### Erro 500 nas funções:
- Verifique se as variáveis de ambiente estão corretas
- Confirme se a planilha está compartilhada com o Service Account
- Verifique os logs em "Functions" > "View logs"

### Planilha não atualiza:
- Confirme o ID da planilha
- Verifique se o Service Account tem permissão de edição
- Teste a conexão nas ferramentas de desenvolvedor

### Site não carrega:
- Verifique se todos os arquivos foram enviados
- Confirme se o `netlify.toml` está na raiz do projeto
- Verifique os logs de build

## 9. Monitoramento

- **Analytics:** Ative o Netlify Analytics para monitorar uso
- **Logs:** Monitore os logs das funções regularmente
- **Uptime:** Configure alertas de uptime se necessário

## 10. Backup e Manutenção

- **Backup da planilha:** Faça backup regular da planilha do Google Sheets
- **Versionamento:** Use Git para controlar versões do código
- **Atualizações:** Monitore atualizações das dependências

---

**🎉 Parabéns! Seu sistema está configurado e funcionando no Netlify!**

URL do seu site: `https://seu-site.netlify.app`

Para suporte adicional, consulte:
- [Documentação do Netlify](https://docs.netlify.com/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [README.md](./README.md) do projeto