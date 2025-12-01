import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DashboardView({ apiBase }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/reports/dashboard`);
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const { financial, stockHealth, performance, orders, alerts } = metrics;

  const getHealthColor = (status) => {
    switch (status) {
      case 'good':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getHealthLabel = (status) => {
    switch (status) {
      case 'good':
        return '✓ Healthy';
      case 'warning':
        return '⚠ Warning';
      case 'critical':
        return '✗ Critical';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <h2>📊 Dashboard Overview</h2>
        <button onClick={fetchMetrics} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {/* Stock Health Meter */}
      <div className="health-meter-card">
        <h3>Stock Health Status</h3>
        <div className="health-meter">
          <div
            className="health-indicator"
            style={{ backgroundColor: getHealthColor(stockHealth.status) }}
          >
            <div className="health-label">{getHealthLabel(stockHealth.status)}</div>
            <div className="health-subtitle">
              {stockHealth.healthyPercent}% of inventory is properly stocked
            </div>
          </div>
        </div>
        <div className="health-breakdown">
          <div className="health-segment healthy">
            <div className="segment-value">{stockHealth.healthyStockCount}</div>
            <div className="segment-label">Healthy Stock</div>
            <div className="segment-percent">{stockHealth.healthyPercent}%</div>
          </div>
          <div className="health-segment warning">
            <div className="segment-value">{stockHealth.lowStockCount}</div>
            <div className="segment-label">Low Stock</div>
            <div className="segment-percent">{stockHealth.stockoutRiskPercent}%</div>
          </div>
          <div className="health-segment critical">
            <div className="segment-value">{stockHealth.overstockCount}</div>
            <div className="segment-label">Overstock</div>
            <div className="segment-percent">{stockHealth.overstockPercent}%</div>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="metrics-grid">
        <div className="metric-card financial">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Inventory Value</div>
            <div className="metric-value">${Number(financial.totalInventoryValue).toLocaleString()}</div>
            <div className="metric-subtitle">Cost Basis</div>
          </div>
        </div>

        <div className="metric-card financial">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <div className="metric-label">Potential Sales Value</div>
            <div className="metric-value">${Number(financial.potentialSalesValue).toLocaleString()}</div>
            <div className="metric-subtitle">Retail Basis (40% markup)</div>
          </div>
        </div>

        <div className="metric-card financial">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Profit Margin</div>
            <div className="metric-value">{financial.profitMargin}%</div>
            <div className="metric-subtitle">Potential Profit</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card performance">
          <div className="metric-icon">🔄</div>
          <div className="metric-content">
            <div className="metric-label">Inventory Turnover</div>
            <div className="metric-value">{performance.inventoryTurnover}x</div>
            <div className="metric-subtitle">Last 90 Days</div>
          </div>
        </div>

        <div className="metric-card performance">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-label">Total Movement</div>
            <div className="metric-value">{performance.totalMovement}</div>
            <div className="metric-subtitle">Units Sold (90 days)</div>
          </div>
        </div>

        <div className="metric-card performance">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Avg Inventory</div>
            <div className="metric-value">{performance.avgInventory}</div>
            <div className="metric-subtitle">Units per Product</div>
          </div>
        </div>
      </div>

      {/* Orders & Alerts */}
      <div className="metrics-grid">
        <div className="metric-card orders">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-label">Total Orders</div>
            <div className="metric-value">{orders.total}</div>
            <div className="metric-breakdown">
              <span className="success">✓ {orders.completed} Completed</span>
              <span className="pending">⏳ {orders.pending} Pending</span>
            </div>
          </div>
        </div>

        <div className="metric-card alerts">
          <div className="metric-icon">🔔</div>
          <div className="metric-content">
            <div className="metric-label">Recent Alerts</div>
            <div className="metric-value">{alerts.recentCount}</div>
            <div className="metric-subtitle">Last 7 Days</div>
          </div>
        </div>

        <div className="metric-card products">
          <div className="metric-icon">🏷️</div>
          <div className="metric-content">
            <div className="metric-label">Total Products</div>
            <div className="metric-value">{stockHealth.totalProducts}</div>
            <div className="metric-subtitle">Active SKUs</div>
          </div>
        </div>
      </div>

      {/* Stock Risk Indicators */}
      <div className="risk-indicators">
        <h3>⚠️ Risk Indicators</h3>
        <div className="risk-grid">
          <div className={`risk-card ${stockHealth.stockoutRiskPercent > 30 ? 'critical' : stockHealth.stockoutRiskPercent > 15 ? 'warning' : 'good'}`}>
            <div className="risk-title">Stockout Risk</div>
            <div className="risk-value">{stockHealth.stockoutRiskPercent}%</div>
            <div className="risk-description">
              {stockHealth.lowStockCount} products below reorder point
            </div>
          </div>

          <div className={`risk-card ${stockHealth.overstockPercent > 40 ? 'critical' : stockHealth.overstockPercent > 25 ? 'warning' : 'good'}`}>
            <div className="risk-title">Overstock Risk</div>
            <div className="risk-value">{stockHealth.overstockPercent}%</div>
            <div className="risk-description">
              {stockHealth.overstockCount} products exceeding optimal levels
            </div>
          </div>

          <div className={`risk-card ${performance.inventoryTurnover < 1 ? 'warning' : 'good'}`}>
            <div className="risk-title">Turnover Rate</div>
            <div className="risk-value">{performance.inventoryTurnover}x</div>
            <div className="risk-description">
              {performance.inventoryTurnover < 1 ? 'Slow-moving inventory' : 'Healthy turnover'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
