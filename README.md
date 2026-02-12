# Smart Supply Chain Management System

A full-stack inventory and supply chain management system with AI-powered insights, built with React, Node.js, PostgreSQL, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- MongoDB (v6+)
- Google Gemini API Key (optional, for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd "FINAL PROJECT -DBMS 2"
```

2. **Setup Backend**
```bash
cd backend
npm install
```

3. **Setup Frontend**
```bash
cd frontend
npm install
```

4. **Configure Environment Variables**

Create `backend/.env`:
```env
# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGDATABASE=smart_supply_chain
PGUSER=your_username
PGPASSWORD=your_password

# Server
PORT=4001

# JWT
JWT_SECRET=your-secret-key-here

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=smart_supply_chain

# Google Gemini AI (Optional)
GEMINI_API_KEY=your_api_key_here
GEMINI_FALLBACK_API_KEY=your_fallback_key_here
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:4001
```

5. **Setup Database**
```bash
# Create PostgreSQL database
createdb smart_supply_chain

# Run migrations (from backend directory)
psql -U your_username -d smart_supply_chain -f db/auth_schema.sql
psql -U your_username -d smart_supply_chain -f create-inventory-flow-tables.sql
psql -U your_username -d smart_supply_chain -f create-audit-trail.sql
psql -U your_username -d smart_supply_chain -f add-user-ownership.sql

# Seed data (optional)
node scripts/seed.js
```

6. **Start the Application**

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

7. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4001

### Default Login
```
Email: admin@logicore.com
Password: admin123
```

---

## 📋 Features

### Core Features
- **Inventory Management**: Track products, stock levels, and reorder points
- **Order Management**: Create and manage customer orders
- **Supplier Management**: Maintain supplier information and relationships
- **User Authentication**: Secure JWT-based authentication with role-based access
- **Multi-user Support**: User isolation with admin oversight

### AI Features (Optional)
- **AI-Powered Reports**: Weekly and monthly inventory analysis
- **Business Insights**: Stock health, financial impact, and recommendations
- **Dual API Key System**: Automatic fallback for high availability
- **Smart Alerts**: Intelligent stock level monitoring

### Analytics
- **Dashboard**: Real-time metrics and KPIs
- **Reports**: Inventory snapshots and trend analysis
- **Activity Logs**: Comprehensive audit trail in MongoDB

---

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Router (Wouter)
- Tailwind CSS + shadcn/ui
- Recharts for visualizations

### Backend
- Node.js + Express
- PostgreSQL (inventory data)
- MongoDB (logs, reports)
- Google Gemini AI (optional)

### Authentication
- JWT tokens
- bcrypt password hashing
- Role-based access control

---

## 📁 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   ├── dal/             # Data access layer
│   │   ├── aiClient.js      # AI integration
│   │   └── server.js        # Entry point
│   ├── scripts/             # Database scripts
│   └── .env                 # Configuration
│
├── frontend/
│   └── client/
│       └── src/
│           ├── pages/       # Page components
│           ├── components/  # Reusable components
│           ├── lib/         # Utilities
│           └── App.tsx      # Main app
│
└── db/                      # SQL schemas
```

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### AI Reports (Optional)
- `POST /api/ai-reports/generate` - Generate AI report
- `GET /api/ai-reports/list` - List all reports
- `GET /api/ai-reports/:id` - Get specific report
- `GET /api/ai-reports/status/ai-system` - AI system status

---

## 🤖 AI Features Setup

### Get Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```

### Features Without AI
The system works fully without AI keys. AI features will be disabled but all core functionality remains available.

---

## 🗄️ Database Schema

### PostgreSQL Tables
- `users` - User accounts
- `products` - Product inventory
- `suppliers` - Supplier information
- `orders` - Customer orders
- `order_items` - Order line items
- `audit_log` - Activity tracking
- Plus 20+ additional tables for advanced features

### MongoDB Collections
- `ai_reports` - Generated AI reports
- `activity_logs` - User activity logs
- `ai_insights` - AI-generated insights
- `analytics_snapshots` - Analytics data

---

## 👥 User Roles

### Admin
- View all data across all users
- Create orders with any products
- Full system access

### Regular User
- View only their own data
- Create orders with their own products
- Isolated workspace

---

## 🔧 Common Commands

```bash
# Backend
npm start              # Start server
npm run dev            # Development mode with nodemon

# Frontend
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build

# Database
psql -U username -d smart_supply_chain    # Connect to PostgreSQL
mongosh mongodb://localhost:27017         # Connect to MongoDB

# Check what's in MongoDB
mongosh mongodb://localhost:27017/smart_supply_chain --eval "db.getCollectionNames().forEach(col => print(col + ': ' + db[col].countDocuments()))"

# Check PostgreSQL tables
psql -U username -d smart_supply_chain -c "\dt"
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Check MongoDB is running: `mongosh --eval "db.version()"`
- Verify `.env` file exists and has correct values

### Frontend can't connect to backend
- Verify backend is running on port 4001
- Check `frontend/.env` has correct `VITE_API_URL`
- Check browser console for CORS errors

### AI features not working
- Verify `GEMINI_API_KEY` is set in `backend/.env`
- Check API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check backend logs for AI-related errors

### Database connection errors
- PostgreSQL: Check credentials in `backend/.env`
- MongoDB: Ensure MongoDB is running on port 27017
- Check firewall settings

---

## 📚 Additional Documentation

- **[PROJECT_DESCRIPTION.md](./PROJECT_DESCRIPTION.md)** - Comprehensive project documentation
- **[API_KEY_ARCHITECTURE.md](./API_KEY_ARCHITECTURE.md)** - AI integration details
- **[GEMINI_PROMPTS_LOCATION.md](./GEMINI_PROMPTS_LOCATION.md)** - AI prompt documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is for educational purposes.

---

## 👨‍💻 Authors

- Mohit Sahoo

---

## 🙏 Acknowledgments

- Google Gemini AI for intelligent insights
- shadcn/ui for beautiful components
- PostgreSQL and MongoDB communities

---

**Need help?** Check [PROJECT_DESCRIPTION.md](./PROJECT_DESCRIPTION.md) for detailed documentation.
