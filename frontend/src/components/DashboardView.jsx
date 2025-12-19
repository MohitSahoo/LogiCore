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
    const interval = setInterval(load, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="banner-error">{error}</div>;
  if (!data) return null;

  const { financial, stockHealth, performance, orders, alerts } = data;

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <p className="text-muted">Real-time overview of your supply chain</p>
      </div>

      {/* Financial Metrics */}
      <div className="metrics-grid">
        <div className="metric-card financial">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Inventory Value</h3>
            <div className="metric-value">${parseFloat(financial?.totalInventoryValue || 0).toFixed(2)}</div>
            <p className="metric-label">Cost Basis</p>
          </div>
        </div>

        <div className="metric-card financial">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <h3>Potential Sales Value</h3>
            <div className="metric-value">${parseFloat(financial?.potentialSalesValue || 0).toFixed(2)}</div>
            <p className="metric-label">Retail Value</p>
          </div>
        </div>

        <div className="metric-card financial">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Profit Margin</h3>
            <div className="metric-value">{parseFloat(financial?.profitMargin || 0).toFixed(1)}%</div>
            <p className="metric-label">Expected Profit</p>
          </div>
        </div>

        <div className="metric-card financial">
          <div className="metric-icon">🔄</div>
          <div className="metric-content">
            <h3>Inventory Turnover</h3>
            <div className="metric-value">{parseFloat(performance?.inventoryTurnover || 0).toFixed(2)}</div>
            <p className="metric-label">Last 90 Days</p>
          </div>
        </div>
      </div>

      {/* Stock Health */}
      <div className="section-card">
        <h3>📦 Stock Health</h3>
        <div className="stock-health-grid">
          <div className="health-item">
            <div className="health-label">Overall Status</div>
            <div className={`health-status status-${stockHealth?.status?.toLowerCase() || 'unknown'}`}>
              {stockHealth?.status?.toUpperCase() || 'Unknown'}
            </div>
          </div>
          <div className="health-item">
            <div className="health-label">Healthy Stock</div>
            <div className="health-value good">{parseFloat(stockHealth?.healthyPercent || 0).toFixed(1)}%</div>
          </div>
          <div className="health-item">
            <div className="health-label">Low Stock Risk</div>
            <div className="health-value warning">{parseFloat(stockHealth?.stockoutRiskPercent || 0).toFixed(1)}%</div>
          </div>
          <div className="health-item">
            <div className="health-label">Overstock</div>
            <div className="health-value info">{parseFloat(stockHealth?.overstockPercent || 0).toFixed(1)}%</div>
          </div>
        </div>

        <div className="health-bar">
          <div 
            className="health-segment good" 
            style={{ width: `${stockHealth?.healthyPercent || 0}%` }}
            title={`Healthy: ${parseFloat(stockHealth?.healthyPercent || 0).toFixed(1)}%`}
          ></div>
          <div 
            className="health-segment warning" 
            style={{ width: `${stockHealth?.stockoutRiskPercent || 0}%` }}
            title={`Low Stock: ${parseFloat(stockHealth?.stockoutRiskPercent || 0).toFixed(1)}%`}
          ></div>
          <div 
            className="health-segment info" 
            style={{ width: `${stockHealth?.overstockPercent || 0}%` }}
            title={`Overstock: ${parseFloat(stockHealth?.overstockPercent || 0).toFixed(1)}%`}
          ></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stockHealth?.totalProducts || 0}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stockHealth?.healthyStockCount || 0}</div>
            <div className="stat-label">Healthy Stock</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{orders?.total || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stockHealth?.lowStockCount || 0}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>
      </div>

      {/* Orders Breakdown */}
      <div className="section-card">
        <h3>📋 Orders Overview</h3>
        <div className="orders-grid">
          <div className="order-stat">
            <div className="order-label">Pending</div>
            <div className="order-value pending">{orders?.pending || 0}</div>
          </div>
          <div className="order-stat">
            <div className="order-label">Completed</div>
            <div className="order-value completed">{orders?.completed || 0}</div>
          </div>
          <div className="order-stat">
            <div className="order-label">Cancelled</div>
            <div className="order-value cancelled">{orders?.cancelled || 0}</div>
          </div>
          <div className="order-stat">
            <div className="order-label">Completion Rate</div>
            <div className="order-value rate">
              {orders?.total > 0 ? ((orders?.completed / orders?.total) * 100).toFixed(1) : '0'}%
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stockHealth?.lowStockCount > 0 && (
        <div className="section-card alert-section">
          <h3>⚠️ Low Stock Alerts ({stockHealth.lowStockCount})</h3>
          <div className="alert-note">
            <p>{stockHealth.lowStockCount} product(s) are below their reorder level and need attention.</p>
            <p>View the Products tab to see which items need restocking.</p>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="section-card">
        <h3>📈 Performance Metrics</h3>
        <div className="performance-grid">
          <div className="performance-item">
            <div className="performance-label">Total Movement (90 days)</div>
            <div className="performance-value">{performance?.totalMovement || 0} units</div>
          </div>
          <div className="performance-item">
            <div className="performance-label">Average Inventory</div>
            <div className="performance-value">{parseFloat(performance?.avgInventory || 0).toFixed(0)} units</div>
          </div>
          <div className="performance-item">
            <div className="performance-label">Inventory Turnover Rate</div>
            <div className="performance-value">{parseFloat(performance?.inventoryTurnover || 0).toFixed(2)}x</div>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <p className="text-muted">
          Last updated: {new Date().toLocaleString()} • Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}
