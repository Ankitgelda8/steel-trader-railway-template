#!/bin/sh
# start.sh — Railway startup script
# 1. Seed admin user if DB is fresh
# 2. Start the API server

set -e

# If DATABASE_URL is already set (e.g. Railway PostgreSQL), use it directly.
# Otherwise fall back to SQLite using DB_PATH.
if [ -z "$DATABASE_URL" ]; then
    DB_PATH="${DB_PATH:-/app/steel_trader.db}"
    mkdir -p "$(dirname "$DB_PATH")"
    export DATABASE_URL="sqlite:///${DB_PATH}"
fi

# SQLAlchemy 2.x requires postgresql+psycopg2:// but Railway injects postgresql:// or postgres://
DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|^postgres://|postgresql+psycopg2://|; s|^postgresql://|postgresql+psycopg2://|')
export DATABASE_URL

echo "Using DATABASE_URL: $DATABASE_URL"

# Seed admin user (idempotent — skips if already exists)
# Use || true so a seeding failure does NOT prevent uvicorn from starting
python3 -c "
import sys, os
sys.path.insert(0, '.')
os.environ.setdefault('DATABASE_URL', '${DATABASE_URL}')

from app.db.base import Base, engine, SessionLocal
from app.models.models import User
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()
admin_email = os.getenv('ADMIN_EMAIL', 'admin@steel.com')
admin_pass  = os.getenv('ADMIN_PASSWORD', 'changeme123')

existing = db.query(User).filter(User.email == admin_email).first()
if not existing:
    user = User(
        name='Admin',
        email=admin_email,
        hashed_password=hash_password(admin_pass),
        role='ADMIN',
        is_active=1
    )
    db.add(user)
    db.commit()
    print(f'Created admin user: {admin_email}')
else:
    print(f'Admin user already exists: {existing.email}')
db.close()
" || echo "[WARN] Admin seeding failed — continuing startup"

# Start FastAPI
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers 1 \
    --log-level info
