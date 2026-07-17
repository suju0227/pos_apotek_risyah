@echo off
title Codebase Memory MCP - POS Apotek
echo ============================================
echo   Codebase Memory MCP - POS Apotek Risyah
echo ============================================
echo.
echo Starting server with Graph UI on port 9749...
echo Graph UI: http://127.0.0.1:9749
echo.
echo Press Ctrl+C to stop the server.
echo.
"%LOCALAPPDATA%\Programs\codebase-memory-mcp\codebase-memory-mcp.exe" --ui=true --port=9749
pause
