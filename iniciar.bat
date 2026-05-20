@echo off
REM ════════════════════════════════════════════════
REM   Leme Financeira — CRM
REM   Duplo clique aqui inicia tudo automaticamente
REM ════════════════════════════════════════════════

title Leme CRM - Inicializador

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║       Leme Financeira — CRM                  ║
echo  ║       Iniciando servidor e interface...      ║
echo  ╚══════════════════════════════════════════════╝
echo.

REM Garante que estamos na pasta onde o .bat está
cd /d "%~dp0"

REM Verifica se as pastas existem
if not exist "server\package.json" (
    echo [ERRO] Pasta 'server' nao encontrada.
    echo Coloque este arquivo dentro da pasta 'leme-crm'.
    pause
    exit /b 1
)
if not exist "client\package.json" (
    echo [ERRO] Pasta 'client' nao encontrada.
    pause
    exit /b 1
)

REM Verifica se Node.js esta instalado
where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado.
    echo Baixe em https://nodejs.org e tente novamente.
    pause
    exit /b 1
)

REM Instala dependencias se ainda nao foram instaladas
if not exist "server\node_modules" (
    echo [1/2] Instalando dependencias do servidor pela primeira vez...
    cd server
    call npm install
    cd ..
)
if not exist "client\node_modules" (
    echo [2/2] Instalando dependencias do cliente pela primeira vez...
    cd client
    call npm install
    cd ..
)

REM Abre o servidor em uma janela nova
echo [SERVIDOR] Abrindo na porta 4000...
start "Leme CRM - Servidor" cmd /k "cd /d %~dp0server && npm start"

REM Aguarda 3 segundos para o servidor subir
timeout /t 3 /nobreak >nul

REM Abre o cliente em outra janela nova
echo [CLIENTE] Abrindo na porta 5173...
start "Leme CRM - Cliente" cmd /k "cd /d %~dp0client && npm run dev"

REM Aguarda 4 segundos e abre o navegador
timeout /t 4 /nobreak >nul
echo [NAVEGADOR] Abrindo http://localhost:5173 ...
start http://localhost:5173

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   Pronto! O CRM esta rodando.                ║
echo  ║                                              ║
echo  ║   Duas janelas de terminal foram abertas:    ║
echo  ║    - "Leme CRM - Servidor" (porta 4000)      ║
echo  ║    - "Leme CRM - Cliente"  (porta 5173)      ║
echo  ║                                              ║
echo  ║   Para FECHAR o CRM, basta fechar as duas    ║
echo  ║   janelas pretas que foram abertas.          ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo Esta janela pode ser fechada.
echo.
pause
