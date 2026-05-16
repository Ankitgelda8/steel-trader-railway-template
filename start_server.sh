#!/bin/zsh
# Steel Trader — start backend
VENV=/Users/ankitgelda/NiftyResearch/SteelTrader/backend/.venv
BACKEND=/Users/ankitgelda/NiftyResearch/SteelTrader/backend

deactivate 2>/dev/null || true
unset VIRTUAL_ENV
unset VIRTUAL_ENV_PROMPT

PYTHONPATH="$BACKEND" "$VENV/bin/python3" -m uvicorn app.main:app \
    --reload \
    --port 8000 \
    --app-dir "$BACKEND" \
    --log-level info
