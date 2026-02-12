import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DashboardView({ apiBase }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${apiBase}/reports/dashboard`);
      setData(res.data);
    } catch (err) {
      console.error('Dashboard load failed:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const { financial, stockHealth, performance, orders } = data;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Overview of your supply chain operations</p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">Inventory Value</div>
          <div className="metric-value">{formatCurrency(financial?.totalInventoryValue)}</div>
          <div className="metric-sub">Cost basis</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Sales Potential</div>
          <div className="metric-value">{formatCurrency(financial?.potentialSalesValue)}</div>
          <div className="metric-sub">Retail value</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Profit Margin</div>
          <div className="metric-value">{Number(financial?.profitMargin || 0).toFixed(1)}%</div>
          <div className="metric-sub">Expected return</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Turnover</div>
          <div className="metric-value">{Number(performance?.inventoryTurnover || 0).toFixed(2)}x</div>
          <div className="metric-sub">Last 90 days</div>
        </div>
      </div>

      {/* Stock Health */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Stock Health</span>
          <span className={`badge ${stockHealth?.status === 'HEALTHY' ? 'badge-success' :
            stockHealth?.status === 'WARNING' ? 'badge-warning' : 'badge-danger'
            }`}>
            {stockHealth?.status || 'Unknown'}
          </span>
        </div>

        <div className="card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{Number(stockHealth?.healthyPercent || 0).toFixed(0)}%</div>
              <div className="stat-label">Healthy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value warning">{Number(stockHealth?.stockoutRiskPercent || 0).toFixed(0)}%</div>
              <div className="stat-label">Low Stock</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{Number(stockHealth?.overstockPercent || 0).toFixed(0)}%</div>
              <div className="stat-label">Overstock</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stockHealth?.totalProducts || 0}</div>
              <div className="stat-label">Products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Quick Stats</span>
        </div>

        <div className="card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stockHealth?.totalProducts || 0}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="stat-item">
              <div className="stat-value success">{stockHealth?.healthyStockCount || 0}</div>
              <div className="stat-label">Healthy Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{orders?.total || 0}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-item">
              <div className="stat-value warning">{stockHealth?.lowStockCount || 0}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Overview */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Orders</span>
        </div>

        <div className="card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value warning">{orders?.pending || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-item">
              <div className="stat-value success">{orders?.completed || 0}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value danger">{orders?.cancelled || 0}</div>
              <div className="stat-label">Cancelled</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {orders?.total > 0 ? ((orders.completed / orders.total) * 100).toFixed(0) : 0}%
              </div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Performance</span>
        </div>

        <div className="card">
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-item">
              <div className="stat-value">{performance?.totalMovement || 0}</div>
              <div className="stat-label">Movement (90d)</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{Number(performance?.avgInventory || 0).toFixed(0)}</div>
              <div className="stat-label">Avg Inventory</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{Number(performance?.inventoryTurnover || 0).toFixed(2)}x</div>
              <div className="stat-label">Turnover Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>
          Updated {new Date().toLocaleTimeString()} · Auto-refresh 30s
        </p>
      </div>
    </div>
  );
}
