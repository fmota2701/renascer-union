# Configuração do Netlify - Passo a Passo

## 1. Preparação dos Arquivos

Antes de fazer o deploy, certifique-se de que você tem:

- ✅ Projeto Supabase configurado
- ✅ Credenciais do Supabase (URL e chaves)
- ✅ Tabelas criadas no Supabase
- ✅ Código atualizado para usar Supabase

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

   **SUPABASE_URL**
   - Key: `SUPABASE_URL`
   - Value: `https://seu-projeto.supabase.co`
   
   **SUPABASE_ANON_KEY**
   - Key: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (sua chave anon)
   
   **SUPABASE_SERVICE_KEY**
   - Key: `SUPABASE_SERVICE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (sua chave service_role)
   
   **FRONTEND_URL**
   - Key: `FRONTEND_URL`
   - Value: `https://seu-site.netlify.app` (URL do seu site no Netlify)

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

## 7. Testar Integração com Supabase

1. **Abra o console do navegador (F12)**
2. **Teste as funcionalidades:**
   - Adicione um jogador
   - Adicione um item
   - Faça uma distribuição
   - Verifique se os dados aparecem no Supabase

## 8. Solução de Problemas

### Erro 500 nas funções:
- Verifique se as variáveis de ambiente estão corretas
- Confirme se as credenciais do Supabase estão válidas
- Verifique os logs em "Functions" > "View logs"

### Dados não salvam no Supabase:
- Confirme as URLs e chaves do Supabase
- Verifique se as tabelas foram criadas corretamente
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

- **Backup do Supabase:** Configure backups automáticos no Supabase
- **Versionamento:** Use Git para controlar versões do código
- **Atualizações:** Monitore atualizações das dependências

---

**🎉 Parabéns! Seu sistema está configurado e funcionando no Netlify!**

URL do seu site: `https://seu-site.netlify.app`

Para suporte adicional, consulte:
- [Documentação do Netlify](https://docs.netlify.com/)
- [Documentação do Supabase](https://supabase.com/docs)
- [README.md](./README.md) do projeto