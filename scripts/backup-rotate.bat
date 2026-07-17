@echo off
setlocal
cd /d "%~dp0\.."

set BACKUP_DIR=%~dp0\..\backups\daily
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set TIMESTAMP=%%i
set BACKUP_FILE=%BACKUP_DIR%\pos_apotek_%TIMESTAMP%.sql

echo Menjalankan backup database pos_apotek...
docker exec -t pos_apotek_postgres pg_dump -U postgres pos_apotek > "%BACKUP_FILE%"

if errorlevel 1 (
  echo ERROR: Backup gagal dibuat pada %TIMESTAMP% >> "%~dp0\backup_error.log"
  exit /b 1
)

echo Backup berhasil dibuat: %BACKUP_FILE%

echo Menjalankan rotasi backup (retensi 30 hari)...
powershell -NoProfile -Command "if (Test-Path '%BACKUP_DIR%') { Get-ChildItem -Path '%BACKUP_DIR%' -Filter 'pos_apotek_*.sql' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force }"

echo Selesai.
