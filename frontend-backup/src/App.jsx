import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ThemeProvider, useTheme } from './contexts/ThemeContext.jsx';
import AuthPage from './components/AuthPage.jsx';
import UserProfile from './components/UserProfile.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

import DashboardView from './components/DashboardView.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import UserProfileSettings from './components/UserProfileSettings.jsx';
import ProductsView from './components/ProductsView.jsx';
import SuppliersView from './components/SuppliersView.jsx';
import OrdersView from './components/OrdersView.jsx';
import AlertsView from './components/AlertsView.jsx';
import AIStockReportsView from './components/AIStockReportsView.jsx';

import InventoryView from './components/InventoryView.jsx';
import AIReportsView from './components/AIReportsView.jsx';

const API_BASE = 'http://localhost:4000/api';

const NAV_ITEMS = [
  {
    key: 'dashboard', label: 'Dashboard', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    )
  },
  {
    key: 'products', label: 'Products', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    )
  },
  {
    key: 'inventory', label: 'Inventory', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
      </svg>
    )
  },
  {
    key: 'orders', label: 'Orders', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    )
  },
  {
    key: 'suppliers', label: 'Suppliers', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    key: 'alerts', label: 'Alerts', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  },
  {
    key: 'ai-reports', label: 'AI Reports', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    )
  },
  {
    key: 'profile', label: 'Profile', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  },
];

// Admin-only navigation items
const ADMIN_NAV_ITEMS = [
  ...NAV_ITEMS,
  {
    key: 'admin-dashboard', label: 'Admin Panel', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
      </svg>
    )
  }
];

// Get navigation items based on user role
const getNavItems = (userRole) => {
  return userRole === 'admin' ? ADMIN_NAV_ITEMS : NAV_ITEMS;
};

const MainApp = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryReport, setInventoryReport] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dataChangeCounter, setDataChangeCounter] = useState(0); // Track data changes

  const refreshInventory = async () => {
    const res = await axios.get(`${API_BASE}/reports/inventory`);
    setInventoryReport(res.data || []);
  };

  const refreshAlerts = async () => {
    const res = await axios.get(`${API_BASE}/reports/alerts`);
    setAlerts(res.data || []);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshInventory();
      refreshAlerts();
    }
  }, [isAuthenticated]);

  const handleDataChange = async () => {
    await refreshInventory();
    await refreshAlerts();
    setDataChangeCounter(prev => prev + 1); // Increment counter to trigger re-renders
  };

  const handleForceRefresh = async () => {
    console.log('🔄 Force refreshing all data...');
    await handleDataChange();
    // Force a complete page refresh if needed
    window.location.reload();
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bgApp,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: colors.accent,
          fontSize: '1.5rem'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        // Show comprehensive dashboard for all users, but UserDashboard for regular users if they want personal view
        return user?.role === 'admin' ? 
          <DashboardView apiBase={API_BASE} /> : 
          <UserDashboard apiBase={API_BASE} onTabChange={setActiveTab} />;
      case 'admin-dashboard':
        return user?.role === 'admin' ? 
          <AdminDashboard apiBase={API_BASE} /> : 
          <UserDashboard apiBase={API_BASE} onTabChange={setActiveTab} />;
      case 'products':
        return <ProductsView apiBase={API_BASE} onChange={handleDataChange} dataChangeCounter={dataChangeCounter} />;
      case 'suppliers':
        return <SuppliersView apiBase={API_BASE} onChange={handleDataChange} />;
      case 'orders':
        return (
          <OrdersView
            apiBase={API_BASE}
            onChange={handleDataChange}
            products={inventoryReport}
          />
        );
      case 'inventory':
        return <InventoryView apiBase={API_BASE} dataChangeCounter={dataChangeCounter} />;
      case 'alerts':
        return <AlertsView inventory={inventoryReport} alerts={alerts} />;
      case 'ai-reports':
        return <AIReportsView apiBase={API_BASE} />;
      case 'profile':
        return <UserProfileSettings apiBase={API_BASE} />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bgApp }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 220,
        background: colors.bgSidebar,
        borderRight: `1px solid ${colors.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: `1px solid ${colors.borderSubtle}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 26,
              height: 26,
              background: colors.accentSubtle,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.accentText,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              L
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.textPrimary }}>
              LogiCore
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
          {getNavItems(user?.role).map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  marginBottom: 1,
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? colors.bgSurfaceHover : 'transparent',
                  color: isActive ? colors.textPrimary : colors.textTertiary,
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  textAlign: 'left',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = colors.bgSurfaceHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 2,
                    height: 16,
                    background: colors.accent,
                    borderRadius: 1,
                  }} />
                )}
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${colors.borderSubtle}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <ThemeToggle />
          </div>
          <UserProfile />
        </div>
      </aside>

      {/* MAIN */}
      <main style={{
        flex: 1,
        marginLeft: 220,
        padding: 32,
        maxWidth: 1100 + 220 + 64,
      }}>
        {renderView()}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
