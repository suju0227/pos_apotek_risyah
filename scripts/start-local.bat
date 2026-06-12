@echo off
setlocal
cd /d "%~dp0\.."

if not exist "backend\.env" (
  echo backend\.env belum ada, menyalin dari backend\.env.example
  copy "backend\.env.example" "backend\.env" > nul
)

if not exist "frontend\.env" (
  echo frontend\.env belum ada, menyalin dari frontend\.env.example
  copy "frontend\.env.example" "frontend\.env" > nul
)

docker compose -f docker-compose.local.yml up -d --build
echo.
echo POS Apotek local mode sedang berjalan.
echo Buka dari server: http://localhost
echo Buka dari client LAN: http://IP_SERVER
pause
