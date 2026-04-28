@echo off
setlocal

set "DIR=%~dp0"
set "VENV=%DIR%.venv"

if not exist "%VENV%\Scripts\python.exe" (
  py -3 -m venv "%VENV%"
)

call "%VENV%\Scripts\activate.bat"
python "%DIR%bootstrap_env.py"

python -c "import PyInstaller" >nul 2>nul
if errorlevel 1 (
  python -m pip install --upgrade pip
  python -m pip install pyinstaller
)

cd /d "%DIR%"
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

pyinstaller --noconfirm lattice_studio.spec

echo.
echo 构建完成:
echo   %DIR%dist\Lattice Studio\Lattice Studio.exe
