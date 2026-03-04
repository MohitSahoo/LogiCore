# LogiCore - Smart Supply Chain Management System

A full-stack inventory and supply chain management system with AI-powered insights, built with React, Node.js, PostgreSQL, and MongoDB.


---

## 🚀 Features

- **Inventory Management** - Track products, stock levels, and reorder points
- **Order Management** - Create and manage customer orders with real-time updates
- **Supplier Management** - Maintain supplier relationships and contact information
- **AI-Powered Insights** - Weekly and monthly inventory analysis with Google Gemini AI
- **Real-time Dashboard** - Live metrics, KPIs, and stock health monitoring
- **Multi-user Support** - Role-based access control with user data isolation
- **Audit Trail** - Comprehensive activity logging in MongoDB
- **Responsive Design** - Works seamlessly on desktop and mobile devices

---

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4 + shadcn/ui
- Wouter (React Router)
- Recharts for data visualization
- Axios for API calls

### Backend
- Node.js + Express
- PostgreSQL 15 (primary database)
- MongoDB Atlas (logs & AI reports)
- Google Gemini AI (optional)
- JWT authentication
- bcrypt password hashing

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Render PostgreSQL + MongoDB Atlas

---

## 📦 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+ (or MongoDB Atlas account)
- Google Gemini API Key (optional)

### 1. Clone Repository
```bash
git clone https://github.com/MohitSahoo/LogiCore.git
cd LogiCore
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Database Setup
```bash
# Connect to PostgreSQL
psql -U your_username -d postgres

# Create database
CREATE DATABASE smart_supply_chain;
\q

# Run migrations
psql -U your_username -d smart_supply_chain -f db/auth_schema.sql
psql -U your_username -d smart_supply_chain -f backend/create-base-schema.sql
psql -U your_username -d smart_supply_chain -f backend/create-inventory-flow-tables.sql
psql -U your_username -d smart_supply_chain -f backend/create-audit-trail.sql
psql -U your_username -d smart_supply_chain -f backend/add-user-ownership.sql

# Create admin user and seed data
node scripts/setup-auth.js
node scripts/seed.js
```

### 4. Frontend Setup
```bash
cd frontend
pnpm install

# Create .env file
echo "VITE_API_URL=http://localhost:4001/api" > .env
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

### 6. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4001
- Login: admin@logicore.com / admin123

---

## 🌐 Production Deployment

### Backend (Render)

1. Create PostgreSQL database on Render
2. Create Web Service on Render
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`

4. Add Environment Variables:
```env
PGHOST=your-render-postgres-host
PGPORT=5432
PGDATABASE=smart_supply_chain
PGUSER=your-db-user
PGPASSWORD=your-db-password
PORT=4001
JWT_SECRET=your-random-secret-key
JWT_EXPIRES_IN=180d
MONGODB_URI=your-mongodb-atlas-uri
MONGODB_DB_NAME=smart_supply_chain
GEMINI_API_KEY=your-gemini-api-key
GEMINI_FALLBACK_API_KEY=your-fallback-key
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

5. Run database migrations via Render Shell or psql

### Frontend (Vercel)

1. Import GitHub repository to Vercel
2. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `pnpm install`

3. Add Environment Variable:
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

4. Deploy!

---

## 📁 Project Structure

```
LogiCore/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth middleware
│   │   ├── dal/             # Data access layer
│   │   ├── db.js            # PostgreSQL connection
│   │   ├── mongodb.js       # MongoDB connection
│   │   ├── aiClient.js      # Gemini AI client
│   │   └── server.js        # Express server
│   ├── scripts/             # Database & setup scripts
│   ├── create-*.sql         # Database migrations
│   └── package.json
│
├── frontend/
│   ├── client/
│   │   ├── src/
│   │   │   ├── pages/       # Page components
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── lib/         # Utilities & API client
│   │   │   └── App.tsx      # Main app component
│   │   └── public/          # Static assets
│   ├── server/              # Production server
│   └── package.json
│
├── db/                      # Database schemas
└── README.md
```

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Reports & Analytics
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/alerts` - Low stock alerts
- `GET /api/reports/ai-stock?period=weekly` - AI-powered stock analysis

### AI Reports
- `POST /api/ai-reports/generate` - Generate AI report
- `GET /api/ai-reports/list` - List all reports
- `GET /api/ai-reports/:id` - Get specific report

---

## 👥 User Roles

### Admin
- Full access to all data
- Can view all users' products and orders
- System-wide analytics

### Regular User
- Access only to their own data
- Isolated workspace
- Personal analytics

---

## 🤖 AI Features

### Setup Gemini API
1. Visit https://aistudio.google.com/app/apikey
2. Create API key
3. Add to backend environment variables

### AI Capabilities
- Weekly/monthly inventory analysis
- Stock health assessment
- Restocking recommendations
- Risk identification
- Business insights

**Note:** System works fully without AI - it's an optional enhancement.

---

## 🔧 Environment Variables

### Backend (.env)
```env
# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGDATABASE=smart_supply_chain
PGUSER=your_username
PGPASSWORD=your_password

# Server
PORT=4001
HOST=0.0.0.0

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=180d

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=smart_supply_chain

# AI (Optional)
GEMINI_API_KEY=your_key
GEMINI_FALLBACK_API_KEY=your_fallback_key

# CORS
CORS_ORIGIN=*
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4001/api
```

---

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use:** Change `PORT` in `.env`
- **Database connection failed:** Check PostgreSQL credentials
- **MongoDB connection failed:** Verify MongoDB is running

### Frontend Issues
- **API calls failing:** Check `VITE_API_URL` in `.env`
- **CORS errors:** Verify backend `CORS_ORIGIN` setting
- **Build fails:** Run `pnpm install` again

### Deployment Issues
- **Render: No open ports:** Ensure `HOST=0.0.0.0` in backend
- **Vercel: 404 on refresh:** Server handles SPA routing automatically
- **CORS on production:** Add Vercel URL to backend `CORS_ORIGIN`

---

## 📊 Database Schema

### Key Tables
- `users` - User accounts & authentication
- `products` - Product inventory
- `suppliers` - Supplier information
- `orders` - Customer orders
- `order_items` - Order line items
- `inventory_movements` - Stock movement history
- `low_stock_alerts` - Automated alerts
- `audit_log` - Activity tracking

---

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
pnpm test
```

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Authors

- **Mohit Sahoo** - [@MohitSahoo](https://github.com/MohitSahoo)
- **Aamir Ibrahim**
- **Anish Agrawal**

---

## 🙏 Acknowledgments

- Google Gemini AI for intelligent insights
- shadcn/ui for beautiful components
- Render & Vercel for hosting
- PostgreSQL & MongoDB communities

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Built with ❤️ for efficient supply chain management**
