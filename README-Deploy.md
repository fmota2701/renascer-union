# 🎮 Renascer Union - Deploy Automático

## 📋 Sobre o Sistema de Deploy

O Renascer Union possui scripts automatizados para facilitar o processo de atualização e deploy da aplicação. Estes scripts automatizam todo o fluxo desde a atualização de dependências até o deploy no Netlify.

## 🚀 Scripts Disponíveis

### Para macOS/Linux: `StartRenascer.sh`
### Para Windows: `StartRenascer.bat`

## 📦 O que os scripts fazem:

1. **Verificação de Dependências**
   - Verifica se Node.js/npm está instalado
   - Verifica se Git está instalado
   - Confirma se está no diretório correto do projeto

2. **Atualização do Sistema**
   - Atualiza todas as dependências npm
   - Executa testes (se configurados)

3. **Controle de Versão**
   - Detecta mudanças no código
   - Faz commit automático com timestamp
   - Envia mudanças para repositório remoto (se configurado)

4. **Deploy Automático**
   - Deploy no Netlify (se CLI estiver configurado)
   - Inicia servidor local para testes

5. **Informações de Acesso**
   - Painel Admin: `http://localhost:8000/admin.html`
   - Sistema Principal: `http://localhost:8000`
   - Distribuição: `http://localhost:8000/distribuicao.html`

## 🛠️ Como Usar

### macOS/Linux:
```bash
# Tornar executável (apenas na primeira vez)
chmod +x StartRenascer.sh

# Executar
./StartRenascer.sh
```

### Windows:
```cmd
# Executar diretamente
StartRenascer.bat
```

## ⚙️ Configuração Inicial do Netlify

Para usar o deploy automático no Netlify:

1. **Instalar Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Fazer login no Netlify:**
   ```bash
   netlify login
   ```

3. **Inicializar projeto:**
   ```bash
   netlify init
   ```

4. **Configurar site (se necessário):**
   ```bash
   netlify link
   ```

## 🔧 Configuração do Git (Opcional)

Para usar o controle de versão automático:

1. **Inicializar repositório:**
   ```bash
   git init
   ```

2. **Adicionar repositório remoto:**
   ```bash
   git remote add origin https://github.com/seu-usuario/renascer-union.git
   ```

3. **Configurar usuário:**
   ```bash
   git config user.name "Seu Nome"
   git config user.email "seu.email@exemplo.com"
   ```

## 📊 Funcionalidades do Sistema

### Painel Administrativo
- Gerenciamento de jogadores
- Controle de itens
- Histórico de distribuições
- Estatísticas em tempo real

### Sistema de Distribuição
- Distribuição individual de itens
- Distribuição múltipla simultânea
- Controle de presença
- Ordem de prioridade

### API Local
- Armazenamento local com localStorage
- Fallback para API externa
- Sincronização automática
- Cache inteligente

## 🐛 Solução de Problemas

### Erro: "npm não encontrado"
- Instale o Node.js: https://nodejs.org/

### Erro: "git não encontrado"
- Instale o Git: https://git-scm.com/

### Erro: "netlify não encontrado"
- Execute: `npm install -g netlify-cli`

### Erro de permissão (macOS/Linux)
- Execute: `chmod +x StartRenascer.sh`

### Porta 8000 em uso
- Pare outros servidores ou altere a porta no package.json

## 📝 Logs e Monitoramento

Os scripts fornecem logs coloridos para facilitar o acompanhamento:
- 🔵 **[INFO]**: Informações gerais
- 🟢 **[SUCCESS]**: Operações bem-sucedidas
- 🟡 **[WARNING]**: Avisos (não impedem execução)
- 🔴 **[ERROR]**: Erros críticos (param execução)

## 🔄 Atualizações Futuras

Para manter o sistema sempre atualizado:
1. Execute o script regularmente
2. Monitore os logs para possíveis problemas
3. Mantenha as dependências atualizadas
4. Faça backup dos dados importantes

---

**Desenvolvido para Renascer Union** 🎮
*Sistema de Gerenciamento de Guild*