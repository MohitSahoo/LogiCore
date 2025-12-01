# Smart Supply Chain & Inventory Management System

Full‑stack demo:

- **Database**: PostgreSQL (`db/schema.sql`, `db/seed.sql`)
- **Backend**: Node.js + Express (`backend/`)
- **Frontend**: React + Vite (`frontend/`)

## Quick Start

1. PostgreSQL:

```bash
createdb smart_supply_chain
psql -d smart_supply_chain -f db/schema.sql
psql -d smart_supply_chain -f db/seed.sql
```

2. Backend:

```bash
cd backend
cp .env.example .env   # adjust credentials
npm install
npm run dev
```

3. Frontend:

```bash
cd ../frontend
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

All UI actions (CRUD on Products/Suppliers/Orders, completing orders, etc.) write through to PostgreSQL and use triggers for:

- Automatic stock deduction on order completion.
- Low‑stock alert entries in `low_stock_alerts`.
- Inventory movement logging in `inventory_movements`.