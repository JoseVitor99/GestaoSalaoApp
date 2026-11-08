#Requires -RunAsAdministrator
# Faz o sistema iniciar sozinho com o Windows (mesmo sem ninguém entrar) e libera a porta 5100 para os celulares
param(
    [string]$Pasta = "C:\GestaoSalao"
)

$ErrorActionPreference = "Stop"
$programa = Join-Path $Pasta "GestaoSalaoApi.exe"

if (-not (Test-Path $programa)) {
    throw "Não encontrei $programa. Rode o publicar.ps1 antes."
}

Write-Host ""
Write-Host "== Gestão de Salão: instalando ==" -ForegroundColor Cyan

# Tarefa agendada na conta do sistema: inicia junto com o Windows e reinicia se cair
$acao = New-ScheduledTaskAction -Execute $programa -WorkingDirectory $Pasta
$gatilho = New-ScheduledTaskTrigger -AtStartup
$conta = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$opcoes = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "GestaoSalao" -Description "Gestão de Salão - CIA da Beleza" -Action $acao -Trigger $gatilho -Principal $conta -Settings $opcoes -Force | Out-Null
Write-Host "Início automático configurado." -ForegroundColor Green

if (-not (Get-NetFirewallRule -DisplayName "Gestão de Salão" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "Gestão de Salão" -Direction Inbound -Protocol TCP -LocalPort 5100 -Action Allow -Profile Private, Domain | Out-Null
}
Write-Host "Porta 5100 liberada na rede privada." -ForegroundColor Green

Start-ScheduledTask -TaskName "GestaoSalao"
Write-Host "Iniciando o sistema..."

$iniciou = $false
foreach ($tentativa in 1..15) {
    Start-Sleep -Seconds 2
    try {
        Invoke-WebRequest "http://localhost:5100/api/auth/situacao" -UseBasicParsing -TimeoutSec 3 | Out-Null
        $iniciou = $true
        break
    }
    catch { }
}

if (-not $iniciou) {
    Write-Host "O sistema não respondeu. Confira em 'Agendador de Tarefas' a tarefa GestaoSalao." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Tudo pronto!" -ForegroundColor Green
Write-Host "  Neste computador:  http://localhost:5100"
$enderecos = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
foreach ($endereco in $enderecos) {
    Write-Host "  Nos celulares (mesmo Wi-Fi):  http://$($endereco.IPAddress):5100"
}

# Em rede "Pública" o Windows bloqueia os celulares mesmo com a porta liberada
if (Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq "Public" }) {
    Write-Host ""
    Write-Host "Atenção: a rede deste computador está como 'Pública'. Para os celulares conseguirem acessar," -ForegroundColor Yellow
    Write-Host "mude para 'Privada' em Configurações > Rede e Internet > (sua rede) > Tipo de perfil de rede." -ForegroundColor Yellow
}

Start-Process "http://localhost:5100"
