@echo off
setlocal
cd /d "%~dp0\.."
docker compose -f docker-compose.local.yml down
echo.
echo POS Apotek local mode dihentikan. Data PostgreSQL tetap aman selama volume tidak dihapus.
pause
