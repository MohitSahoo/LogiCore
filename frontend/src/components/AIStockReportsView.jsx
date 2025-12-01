// frontend/src/components/AIStockReportsView.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AIStockReportsView({ apiBase }) {
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async (p) => {
    const selected = p || period;
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${apiBase}/reports/ai-stock`, {
        params: { period: selected },
      });
      setData(res.data);
      setPeriod(res.data.period || selected);
    } catch (err) {
      console.error(err);
      setError('Failed to load AI stock report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport('daily');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = (next) => {
    if (loading) return;
    setPeriod(next);
    loadReport(next);
  };

  const metrics = data?.metrics || {
    totalSkus: 0,
    lowStockCount: 0,
    totalUnits: 0,
    totalValue: 0,
  };

  const lowStockItems = (data?.items || []).filter((x) => x.is_low_stock);

  return (
    <div className="panel ai-panel">
      <header className="panel-header ai-panel-header">
        <div>
          <h2>AI Stock Insights</h2>
          <p className="panel-subtitle">
            Gemini-generated {period} inventory summary based on your live stock data.
          </p>
        </div>
        <div className="ai-controls">
          <div className="segmented">
            <button
              className={period === 'daily' ? 'segmented-active' : ''}
              onClick={() => handlePeriodChange('daily')}
            >
              Daily
            </button>
            <button
              className={period === 'weekly' ? 'segmented-active' : ''}
              onClick={() => handlePeriodChange('weekly')}
            >
              Weekly
            </button>
            <button
              className={period === 'monthly' ? 'segmented-active' : ''}
              onClick={() => handlePeriodChange('monthly')}
            >
              Monthly
            </button>
          </div>
          <button
            className="primary-btn"
            onClick={() => loadReport(period)}
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Refresh report'}
          </button>
        </div>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      <section className="ai-metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total SKUs</span>
          <span className="metric-value">{metrics.totalSkus}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Low stock items</span>
          <span className="metric-value">{metrics.lowStockCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total units in stock</span>
          <span className="metric-value">{metrics.totalUnits}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Inventory value</span>
          <span className="metric-value">
            ₹{metrics.totalValue.toFixed ? metrics.totalValue.toFixed(2) : metrics.totalValue}
          </span>
        </div>
      </section>

      <section className="ai-layout">
        <div className="ai-report-card">
          <h3>Stock Report</h3>
          {loading && !data && (
            <div className="skeleton-block">
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
          )}
          {!loading && data && (
            <div className="ai-report-body">
              {data.report
                ?.split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
            </div>
          )}
        </div>

        <div className="ai-side-card">
          <h3>Priority low stock items</h3>
          {lowStockItems.length === 0 && <p>Everything looks healthy. No low stock right now.</p>}
          {lowStockItems.length > 0 && (
            <ul className="low-stock-list">
              {lowStockItems.map((item) => (
                <li key={item.id}>
                  <div className="low-stock-main">
                    <span className="sku">{item.sku}</span>
                    <span className="name">{item.name}</span>
                  </div>
                  <div className="low-stock-meta">
                    <span>
                      Qty: <strong>{item.stock_quantity}</strong> / Reorder at{' '}
                      <strong>{item.reorder_level}</strong>
                    </span>
                    {item.supplier_name && (
                      <span className="supplier">{item.supplier_name}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {data?.generatedAt && (
        <footer className="ai-footer">
          <span>Last generated: {new Date(data.generatedAt).toLocaleString()}</span>
        </footer>
      )}
    </div>
  );
}
