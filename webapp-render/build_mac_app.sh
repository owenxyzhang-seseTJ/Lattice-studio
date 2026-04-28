#!/bin/zsh
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$DIR/.venv"

if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
fi

source "$VENV/bin/activate"
python "$DIR/bootstrap_env.py"

if ! python -c "import PyInstaller" >/dev/null 2>&1; then
  python -m pip install --upgrade pip
  python -m pip install pyinstaller
fi

cd "$DIR"
rm -rf build dist
pyinstaller --noconfirm lattice_studio.spec
xattr -cr "$DIR/dist/Lattice Studio.app"
codesign --force --deep -s - "$DIR/dist/Lattice Studio.app"

echo
echo "构建完成:"
echo "  $DIR/dist/Lattice Studio.app"
