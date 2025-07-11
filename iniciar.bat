@echo off
echo Iniciando backend (Flask) y frontend (Vite)...

:: Abre una nueva terminal para el backend
start cmd /k "cd /d %~dp0backEnd && python app.py"

:: Abre una nueva terminal para el frontend
start cmd /k "cd /d %~dp0frontEnd && npm run dev"

exit