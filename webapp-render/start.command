#!/bin/zsh
DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$DIR/.venv"

if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
fi

source "$VENV/bin/activate"

python "$DIR/bootstrap_env.py"

nohup "$VENV/bin/python" "$DIR/server.py" > "$DIR/server.log" 2>&1 &
sleep 2
open "http://127.0.0.1:8765"
