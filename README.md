# Steel Trader — Inventory & Order Management

> A production-ready **inventory management system** for steel traders, building-material businesses, and any commodity distributor. Track purchase orders, manage stock lots, process sales with partial dispatch, and control team access — all from a clean web dashboard.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Ankitgelda8/steel-trader-railway-template)

---

## Features

- **Purchase orders** → receipt of goods → automatic `StockLot` creation per receipt
- **Sale orders** with partial dispatch: allocate from one or more stock lots per truck/delivery
- **Auto order lifecycle**: `OPEN → PARTIAL → COMPLETE` (no manual status updates needed)
- **Role-based access control**: `ADMIN`, `OPERATOR`, `VIEWER`
- **JWT authentication** with configurable token lifetime
- **PostgreSQL** auto-provisioned via Railway addon (SQLite fallback for local dev)
- Auto-generated **Swagger / OpenAPI docs** at `/docs`
- React 18 + Tailwind web dashboard — works on desktop and tablet

---

## One-Click Deploy on Railway

This template deploys **2 services** from a single repo:

| Service | Stack | purpose |
|---|---|---|
| `backend` | Python 3.11 + FastAPI + SQLAlchemy | REST API + business logic |
| `web` | React 18 + Vite + Tailwind | Dashboard UI served via `serve` |

### Steps

1. Click **Deploy on Railway** above
2. Create or sign into your Railway account
3. Fill in the required environment variables (table below)
4. Railway builds and deploys both services automatically
5. Open the **web** service URL — log in with the admin credentials you set

---

## Environment Variables

### Backend service

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | **Yes** | — | JWT signing secret. Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_EMAIL` | No | `admin@steel.com` | Email for the auto-seeded admin account |
| `ADMIN_PASSWORD` | **Yes** | — | Password for the admin account — set something strong |
| `DATABASE_URL` | Auto | `${{Postgres.DATABASE_URL}}` | Auto-provisioned Railway PostgreSQL — no manual setup needed |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` (24 h) | JWT token lifetime in minutes |

### Web service

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | — | Full URL of your backend API: `https://<backend-domain>/api/v1`. Use Railway reference variable: `${{backend.RAILWAY_PUBLIC_DOMAIN}}` |

---

## Architecture

```
┌──────────────────────────────────┐
│  web  (React 18 + Vite + Tailwind) │  → served by `npx serve`  (Railway)
└──────────────┬───────────────────┘
               │ HTTPS REST
┌──────────────▼───────────────────┐
│  backend  (FastAPI + SQLAlchemy)  │  → Uvicorn on $PORT  (Railway)
└──────────────┬───────────────────┘
               │ SQLAlchemy ORM
         SQLite (dev) / PostgreSQL (prod)
```

### Key concepts

- Every **purchase receipt** creates a `StockLot` tagged to its purchase order
- Every **sale dispatch** manually allocates from one or more `StockLot`s
- Orders transition automatically: `OPEN → PARTIAL → COMPLETE`

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # edit SECRET_KEY and ADMIN_PASSWORD
uvicorn app.main:app --reload
# API → http://localhost:8000
# Docs → http://localhost:8000/docs
```

### Web

```bash
cd web
npm install
cp .env.example .env               # VITE_API_URL=http://localhost:8000/api/v1
npm run dev
# UI → http://localhost:3000
```

---

## Adapting to Your Business

This template is intentionally generic. Common customisations:

| Goal | Where to change |
|---|---|
| Rename "Steel Trader" to your brand | `backend/app/core/config.py` → `app_name` |
| Add product categories / SKUs | Add a `Product` model in `backend/app/models/models.py` |
| Add invoice PDF generation | Add a `reportlab` or `weasyprint` endpoint in `backend/app/api/v1/endpoints/` |
| Add email notifications | Add SMTP env vars + integrate `fastapi-mail` |
| Multi-currency support | Add a `currency` field to sale order schema |
| Connect to mobile app | The backend REST API is fully mobile-ready — use the same `VITE_API_URL` as the app's base URL |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic, `passlib[bcrypt]`, `python-jose` |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Axios |
| Database | PostgreSQL (Railway addon, auto-provisioned) |
| Deploy | Railway (Nixpacks auto-builder — no Dockerfile needed) |

---

## License

MIT — fork it, adapt it, sell it.

---

## iOS Setup

### Requirements
- Xcode 15+
- iOS 17 simulator or physical device

### Steps

1. Open `ios/SteelTrader.xcodeproj` (or `SteelTrader.xcworkspace` if using CocoaPods/SPM).
2. Edit `ios/SteelTrader/Network/APIClient.swift` — set `baseURL` to your server IP:
   ```swift
   private let baseURL = "http://YOUR_SERVER_IP:8000/api/v1"
   ```
3. Build & run on the simulator.

> For a physical device on the same network, use your Mac's LAN IP instead of `localhost`.

---

## Android Setup

### Requirements
- Android Studio Hedgehog (2023.1) or newer
- Android SDK 34
- Java 17

### Steps

1. Open the `android/` folder in Android Studio.
2. Edit `app/src/main/java/com/steeltrader/data/remote/api/RetrofitClient.kt`:
   ```kotlin
   // Emulator → host machine:
   private const val BASE_URL = "http://10.0.2.2:8000/api/v1/"

   // Physical device on Wi-Fi → your Mac's LAN IP:
   // private const val BASE_URL = "http://192.168.x.x:8000/api/v1/"
   ```
3. Sync Gradle and run on an emulator or device.

---

## API Overview

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Companies | `GET/POST /masters/companies`, `GET/POST /masters/companies/{id}/branches` |
| Brands | `GET/POST /masters/brands` |
| Customers | `GET/POST /masters/customers` |
| Purchases | `GET/POST /purchases/`, `GET /purchases/{id}`, `POST /purchases/{id}/receipts` |
| Sales | `GET/POST /sales/`, `GET /sales/{id}`, `POST /sales/{id}/dispatches` |
| Stock | `GET /stock/lots`, `GET /stock/dashboard` |

All endpoints (except login/register) require `Authorization: Bearer <token>`.

---

## Features

- **Purchase orders** with truck-by-truck partial receipts
- **Sale orders** with phased truck-by-truck dispatches
- **Manual stock lot allocation** per dispatch — choose which receipt lots to consume
- **Real-time pending qty** and progress bars
- **Dashboard** — open orders, pending receipts/dispatches, stock summary
- **Master data** — Companies, Supplier Branches, Brands, Customers
- **Role-based auth** — Admin / Operator / Viewer
- **Offline-friendly** — all state held on the server, mobile clients are thin

---

## Production Checklist

- [ ] Set a strong `SECRET_KEY`
- [ ] Verify PostgreSQL addon is linked (auto-done by template)
- [ ] Run `alembic upgrade head` for migrations
- [ ] Enable HTTPS (nginx reverse proxy recommended)
- [ ] Change `BASE_URL` / `baseURL` in mobile apps to production URL
- [ ] Configure CORS origins in `backend/app/main.py`
