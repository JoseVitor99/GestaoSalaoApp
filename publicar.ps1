#Requires -RunAsAdministrator
# Gera a versão para uso no salão: telas + API numa pasta só, sem precisar instalar o .NET no computador
param(
    [string]$Destino = "C:\GestaoSalao"
)

$ErrorActionPreference = "Stop"
$api = Join-Path $PSScriptRoot "GestaoSalaoApi\GestaoSalaoApi"
$ui = Join-Path $PSScriptRoot "GestaoSalaoUI"
$tarefa = Get-ScheduledTask -TaskName "GestaoSalao" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "== Gestão de Salão: publicando em $Destino ==" -ForegroundColor Cyan

# Para o sistema instalado, senão o Windows não deixa trocar os arquivos
if ($tarefa) { Stop-ScheduledTask -TaskName "GestaoSalao" }
Get-Process -Name "GestaoSalaoApi" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "1/3 Gerando as telas..." -ForegroundColor Yellow
Push-Location $ui
try {
    if (-not (Test-Path "node_modules")) {
        npm install
        if ($LASTEXITCODE -ne 0) { throw "Falha no npm install." }
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar as telas (npm run build)." }
}
finally {
    Pop-Location
}

Write-Host "2/3 Publicando a API..." -ForegroundColor Yellow
dotnet publish $api -c Release -r win-x64 --self-contained true -o $Destino
if ($LASTEXITCODE -ne 0) { throw "Falha ao publicar a API (dotnet publish)." }

Write-Host "3/3 Copiando as telas..." -ForegroundColor Yellow
$telas = Join-Path $Destino "wwwroot"
if (Test-Path $telas) { Remove-Item $telas -Recurse -Force }
Copy-Item (Join-Path $ui "build") $telas -Recurse

# Na primeira publicação, oferece levar os dados do banco de desenvolvimento
$bancoDestino = Join-Path $Destino "gestaosalao.db"
$bancoOrigem = Join-Path $api "gestaosalao.db"
if (-not (Test-Path $bancoDestino) -and (Test-Path $bancoOrigem)) {
    Write-Host ""
    Write-Host "Encontrei o banco de desenvolvimento com os dados cadastrados até agora." -ForegroundColor Cyan
    Write-Host "Antes de responder, feche o 'dotnet run' se ele estiver aberto."
    $resposta = Read-Host "Levar esses dados para a instalação? (S/N)"
    if ($resposta -match "^[sS]") {
        foreach ($sufixo in "", "-wal", "-shm") {
            if (Test-Path "$bancoOrigem$sufixo") { Copy-Item "$bancoOrigem$sufixo" "$bancoDestino$sufixo" }
        }
        Write-Host "Dados copiados." -ForegroundColor Green
    }
}

if ($tarefa) {
    Start-ScheduledTask -TaskName "GestaoSalao"
    Write-Host "Sistema atualizado e iniciado de novo." -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "Publicado. Para o sistema iniciar sozinho com o Windows, rode agora o instalar.ps1." -ForegroundColor Green
}
