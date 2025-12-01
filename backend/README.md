# Smart Supply Chain Backend (Node.js + Express + PostgreSQL)

## Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE smart_supply_chain;
```

2. Run schema and seed scripts:

```bash
psql -U postgres -d smart_supply_chain -f db/schema.sql
psql -U postgres -d smart_supply_chain -f db/seed.sql
```

3. Configure environment:

```bash
cp .env.example .env
# adjust credentials if needed
```

4. Install dependencies and run:

```bash
npm install
npm run dev
```

The API will run on `http://localhost:4000`.

Key endpoints:

- `GET /api/products` (CRUD)
- `GET /api/suppliers` (CRUD)
- `GET /api/orders` (CRUD)
- `GET /api/reports/inventory`
- `GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/reports/low-stock-alerts`

Inventory changes and low‑stock alerts are handled inside PostgreSQL via triggers defined in `db/schema.sql`.