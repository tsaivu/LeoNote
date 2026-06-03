@echo off
setlocal EnableExtensions EnableDelayedExpansion

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = (Resolve-Path '%~dp0').Path.TrimEnd('\');" ^
  "$ports = @(9111, 9110);" ^
  "$pids = New-Object 'System.Collections.Generic.HashSet[int]';" ^
  "foreach ($port in $ports) { Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | ForEach-Object { [void]$pids.Add([int]$_.OwningProcess) } }" ^
  "$procs = Get-CimInstance Win32_Process;" ^
  "$procs | Where-Object { $_.CommandLine -and ($_.CommandLine -like ('*' + $root + '\backend*') -or $_.CommandLine -like ('*' + $root + '\web*') -or $_.CommandLine -like '*uvicorn app.main:app*' -or $_.CommandLine -like '*vite --host 127.0.0.1 --port 9110*') } | ForEach-Object { [void]$pids.Add([int]$_.ProcessId) };" ^
  "$changed = $true; while ($changed) { $changed = $false; foreach ($proc in $procs) { if ($pids.Contains([int]$proc.ParentProcessId) -and -not $pids.Contains([int]$proc.ProcessId)) { [void]$pids.Add([int]$proc.ProcessId); $changed = $true } } }" ^
  "foreach ($id in $pids) { if ($id -gt 0) { Write-Output ('Stopping LeoNote process PID ' + $id); Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } }"

echo.
echo LeoNote dev servers stopped if they were running.
exit /b 0
