#Requires -RunAsAdministrator
# Tira o início automático e fecha a porta 5100. Os dados (banco e backups) continuam na pasta.
$ErrorActionPreference = "Stop"

if (Get-ScheduledTask -TaskName "GestaoSalao" -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName "GestaoSalao"
    Unregister-ScheduledTask -TaskName "GestaoSalao" -Confirm:$false
}
Get-Process -Name "GestaoSalaoApi" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-NetFirewallRule -DisplayName "Gestão de Salão" -ErrorAction SilentlyContinue | Remove-NetFirewallRule

Write-Host "Início automático removido. Os dados continuam na pasta de instalação." -ForegroundColor Green
