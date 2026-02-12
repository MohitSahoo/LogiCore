# Supply Chain Frontend Architecture

## Backend API Overview
- **Base URL**: `/api`
- **Authentication**: JWT Bearer Token (24h expiry)
- **Routes**:
  - `/api/auth` - Authentication (register, login, profile, password change)
  - `/api/products` - Product CRUD with supplier relationships
  - `/api/suppliers` - Supplier management
  - `/api/orders` - Order management with items
  - `/api/reports` - Inventory reports, alerts, movements
  - `/api/ai-reports` - AI-powered analytics
  - `/api/admin` - Admin functions

## Frontend Structure

### Pages
- `Login` - Authentication entry point
- `Register` - User registration
- `Dashboard` - Main dashboard with overview
- `Products` - Product list and management
- `ProductDetail` - Single product view/edit
- `Suppliers` - Supplier list and management
- `Orders` - Order list and tracking
- `OrderDetail` - Single order view
- `Reports` - Inventory reports and analytics
- `Profile` - User profile management
- `NotFound` - 404 page

### Components
- `Layout` - Main layout wrapper with sidebar
- `Sidebar` - Navigation sidebar
- `Header` - Top header with user menu
- `ProductCard` - Product display component
- `OrderCard` - Order display component
- `InventoryChart` - Stock level visualization
- `LoadingSpinner` - Loading state indicator
- `ErrorAlert` - Error message display
- `FormInput` - Reusable form input
- `Modal` - Reusable modal dialog
- `Table` - Data table component

### Services
- `authService` - Login, register, profile management
- `productService` - Product CRUD operations
- `supplierService` - Supplier CRUD operations
- `orderService` - Order CRUD operations
- `reportService` - Report generation and fetching

### Hooks
- `useAuth` - Authentication context and state
- `useApi` - API request wrapper with error handling
- `useLocalStorage` - Persistent state management

### Utilities
- `api.js` - Axios instance with interceptors
- `constants.js` - App constants and API endpoints
- `formatters.js` - Date, currency, and text formatting

## Design System
- **Color Scheme**: Orange + White theme
- **Typography**: Clean, modern fonts
- **Spacing**: Consistent 8px grid system
- **Components**: Reusable, composable UI elements
- **Responsive**: Mobile-first approach

## State Management
- React Context for authentication
- Local state for component-level data
- LocalStorage for token persistence

## Error Handling
- Global error boundary
- API error interceptors
- User-friendly error messages
- Retry mechanisms for failed requests

## Performance Optimization
- Code splitting for lazy loading
- Image optimization
- Memoization for expensive computations
- Efficient re-renders with React.memo
