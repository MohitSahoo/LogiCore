import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AIStockReportsView({ apiBase }) {
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async (p) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${apiBase}/reports/ai-stock?period=${p}`);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(period); }, []);

  const handlePeriod = (p) => {
    setPeriod(p);
    load(p);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>AI Reports</h1>
          <p>AI-powered inventory analysis</p>
        </div>
        <div className="page-header-actions">
          <div className="period-tabs">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button key={p} className={`period-tab ${p === period ? 'active' : ''}`}
                onClick={() => handlePeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="loading">Generating report…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {report && !loading && (
        <>
          {/* Metrics */}
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-label">Total SKUs</div>
              <div className="metric-value">{report.metrics?.totalSkus || 0}</div>
              <div className="metric-sub">Products tracked</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Low Stock</div>
              <div className="metric-value" style={{ color: (report.metrics?.lowStockCount || 0) > 0 ? '#fbbf24' : 'inherit' }}>
                {report.metrics?.lowStockCount || 0}
              </div>
              <div className="metric-sub">Need attention</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Units</div>
              <div className="metric-value">{(report.metrics?.totalUnits || 0).toLocaleString()}</div>
              <div className="metric-sub">In inventory</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Value</div>
              <div className="metric-value">${Number(report.metrics?.totalValue || 0).toLocaleString()}</div>
              <div className="metric-sub">Total worth</div>
            </div>
          </div>

          {/* Report */}
          <div className="card">
            <div className="card-header">
              <h3>Report Summary</h3>
              <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{period}</span>
            </div>
            <div className="card-body">
              <div className="report-text">{report.report || 'No report available.'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
