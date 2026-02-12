# Smart Supply Chain Frontend

React 18 + Vite frontend with responsive design and real-time updates.

## Features

- Modern React with Hooks
- Real-time dashboard with financial metrics
- Product, Supplier, and Order management
- Natural language chat interface
- Responsive design (mobile-friendly)
- Professional UI with loading states

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

App runs on `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## Components

- **Dashboard** - Financial metrics, stock health, performance indicators
- **ProductsView** - Product catalog with CRUD operations
- **SuppliersView** - Supplier management
- **OrdersView** - Order processing with Complete/Cancel/Delete buttons
- **ChatView** - Natural language chat interface with AI

## Configuration

Backend API URL is configured in components (default: `http://localhost:4000`)

To change, update the `axios` base URL in components or create a config file.

## Features

### Dashboard
- Total inventory value
- Potential sales value
- Profit margin
- Stock health visualization
- Low stock alerts
- Recent activity

### Products
- Create/Edit/Delete products
- Stock level tracking
- Reorder point alerts
- Supplier associations
- Low stock indicators

### Orders
- Create orders with multiple items
- Auto-price filling
- Stock validation
- Complete/Cancel/Delete actions
- Real-time total calculation

### Chat
- Natural language queries
- Intent detection
- Quick query buttons
- Expandable data tables
- Chat history
- Typing indicators

## Tech Stack

- React 18
- Vite
- Axios
- CSS3 (responsive design)
