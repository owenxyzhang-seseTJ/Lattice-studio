@echo off
setlocal
set "DIR=%~dp0"
set "VENV=%DIR%.venv"

if not exist "%VENV%\Scripts\python.exe" (
  py -3 -m venv "%VENV%"
)

call "%VENV%\Scripts\activate.bat"

python "%DIR%bootstrap_env.py"

start "" /B cmd /c "\"%VENV%\Scripts\python.exe\" \"%DIR%server.py\" > \"%DIR%server.log\" 2>&1"
timeout /t 2 >nul
start "" "http://127.0.0.1:8765"
