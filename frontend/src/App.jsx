import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardView from './components/DashboardView.jsx';
import ProductsView from './components/ProductsView.jsx';
import SuppliersView from './components/SuppliersView.jsx';
import OrdersView from './components/OrdersView.jsx';
import AlertsView from './components/AlertsView.jsx';
import AIStockReportsView from './components/AIStockReportsView.jsx';
import InventoryView from './components/InventoryView.jsx';

const API_BASE = 'http://localhost:4000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryReport, setInventoryReport] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const refreshInventory = async () => {
    const res = await axios.get(`${API_BASE}/reports/inventory`);
    setInventoryReport(res.data || []);
  };

  const refreshAlerts = async () => {
    const res = await axios.get(`${API_BASE}/reports/alerts`);
    setAlerts(res.data || []);
  };

  useEffect(() => {
    refreshInventory();
    refreshAlerts();
  }, []);

  const handleDataChange = async () => {
    await refreshInventory();
    await refreshAlerts();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Smart Supply Chain</h1>
          <p className="app-subtitle">Inventory, suppliers, orders & AI-powered stock insights.</p>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={activeTab === 'suppliers' ? 'active' : ''}
          onClick={() => setActiveTab('suppliers')}
        >
          Suppliers
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button
          className={activeTab === 'alerts' ? 'active' : ''}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts
        </button>
        <button
          className={activeTab === 'ai' ? 'active' : ''}
          onClick={() => setActiveTab('ai')}
        >
          AI Stock Reports
        </button>
      </nav>

      <main className="main">
        {activeTab === 'dashboard' && <DashboardView apiBase={API_BASE} />}
        {activeTab === 'products' && (
          <ProductsView
            apiBase={API_BASE}
            onChange={handleDataChange}
          />
        )}
        {activeTab === 'suppliers' && (
          <SuppliersView apiBase={API_BASE} onChange={handleDataChange} />
        )}
        {activeTab === 'orders' && (
          <OrdersView apiBase={API_BASE} onChange={handleDataChange} products={inventoryReport} />
        )}
        {activeTab === 'inventory' && <InventoryView apiBase={API_BASE} />}
        {activeTab === 'alerts' && (
          <AlertsView inventory={inventoryReport} alerts={alerts} />
        )}
        {activeTab === 'ai' && <AIStockReportsView apiBase={API_BASE} />}
      </main>
    </div>
  );
}
