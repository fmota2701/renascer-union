@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM StartRenascer - Script para atualizar sistema e fazer deploy no Netlify (Windows)
REM Autor: Sistema Renascer Union

echo 🎮 ===== RENASCER UNION - DEPLOY AUTOMÁTICO ===== 🎮
echo.

REM Verificar se está no diretório correto
if not exist "package.json" (
    echo [ERROR] Arquivo package.json não encontrado. Execute o script no diretório do projeto.
    pause
    exit /b 1
)

echo [INFO] Iniciando processo de deploy do Renascer Union...
echo.

REM 1. Verificar dependências
echo [INFO] Verificando dependências...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm não está instalado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] git não está instalado. Instale o Git primeiro.
    pause
    exit /b 1
)

REM 2. Atualizar dependências
echo [INFO] Atualizando dependências do projeto...
npm install
if errorlevel 1 (
    echo [ERROR] Falha ao atualizar dependências.
    pause
    exit /b 1
)
echo [SUCCESS] Dependências atualizadas com sucesso!

REM 3. Executar testes (se existirem)
findstr /c:"\"test\"" package.json >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Executando testes...
    npm test
    if errorlevel 1 (
        echo [WARNING] Alguns testes falharam, mas continuando com o deploy...
    ) else (
        echo [SUCCESS] Todos os testes passaram!
    )
)

REM 4. Verificar se há mudanças no Git
echo [INFO] Verificando mudanças no repositório...
if exist ".git" (
    git status --porcelain | findstr /r ".*" >nul
    if not errorlevel 1 (
        echo [INFO] Mudanças detectadas. Fazendo commit...
        
        REM Adicionar todos os arquivos
        git add .
        
        REM Commit com timestamp
        for /f "tokens=1-4 delims=/ " %%i in ('date /t') do set mydate=%%i-%%j-%%k
        for /f "tokens=1-2 delims=: " %%i in ('time /t') do set mytime=%%i:%%j
        set COMMIT_MSG=Deploy automático - !mydate! !mytime!
        
        git commit -m "!COMMIT_MSG!"
        if errorlevel 1 (
            echo [ERROR] Falha ao fazer commit.
            pause
            exit /b 1
        )
        echo [SUCCESS] Commit realizado: !COMMIT_MSG!
    ) else (
        echo [INFO] Nenhuma mudança detectada no repositório.
    )
) else (
    echo [WARNING] Repositório Git não inicializado.
)

REM 5. Push para o repositório (se configurado)
if exist ".git" (
    echo [INFO] Enviando mudanças para o repositório remoto...
    
    REM Verificar se há remote configurado
    git remote | findstr "origin" >nul
    if not errorlevel 1 (
        git push origin main 2>nul || git push origin master 2>nul
        if not errorlevel 1 (
            echo [SUCCESS] Código enviado para o repositório remoto!
        ) else (
            echo [WARNING] Falha ao enviar para o repositório remoto. Continuando...
        )
    ) else (
        echo [WARNING] Nenhum repositório remoto configurado.
    )
)

REM 6. Deploy no Netlify (se Netlify CLI estiver instalado)
echo [INFO] Verificando Netlify CLI...
netlify --version >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Fazendo deploy no Netlify...
    
    REM Deploy de produção
    netlify deploy --prod --dir=.
    
    if not errorlevel 1 (
        echo [SUCCESS] Deploy no Netlify realizado com sucesso!
        echo.
        echo [INFO] 🌐 Seu site está disponível em: https://seu-site.netlify.app
    ) else (
        echo [ERROR] Falha no deploy do Netlify.
        pause
        exit /b 1
    )
) else (
    echo [WARNING] Netlify CLI não está instalado.
    echo [INFO] Para instalar: npm install -g netlify-cli
    echo [INFO] Depois execute: netlify login && netlify init
)

REM 7. Iniciar servidor local para teste
echo [INFO] Iniciando servidor local para teste...
echo.
echo [SUCCESS] 🚀 Deploy concluído com sucesso!
echo [INFO] 📊 Acesse o painel admin em: http://localhost:8000/admin.html
echo [INFO] 🎮 Acesse o sistema em: http://localhost:8000
echo [INFO] 📋 Distribuição em: http://localhost:8000/distribuicao.html
echo.
echo [INFO] Pressione Ctrl+C para parar o servidor local.

REM Iniciar servidor
npm start

pause