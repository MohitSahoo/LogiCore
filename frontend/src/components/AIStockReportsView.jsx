import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AIStockReportsView({ apiBase }) {
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async (p = period) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🤖 Fetching AI stock report for', p);
      const res = await axios.get(`${apiBase}/reports/ai-stock?period=${p}`);
      setReport(res.data);
      console.log('✅ AI stock report loaded');
    } catch (err) {
      console.error('AI report error:', err);
      setError(err.response?.data?.error || 'Failed to load AI report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(period);
  }, []);

  return (
    <div className="panel">
      <section>
        <div className="section-header">
          <h2>AI Stock Report</h2>
          <div className="segmented">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                className={p === period ? 'segmented-active' : ''}
                onClick={() => {
                  setPeriod(p);
                  load(p);
                }}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading">Generating AI report...</div>}
        {error && <div className="banner-error">{error}</div>}

        {report && (
          <>
            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-label">Total SKUs</div>
                <div className="metric-value">{report.metrics?.totalSkus ?? '-'}</div>
              </div>
              <div className="metric-content">
                <div className="metric-label">Low Stock</div>
                <div className="metric-value">{report.metrics?.lowStockCount ?? '-'}</div>
              </div>
              <div className="metric-content">
                <div className="metric-label">Total Units</div>
                <div className="metric-value">{report.metrics?.totalUnits ?? '-'}</div>
              </div>
              <div className="metric-content">
                <div className="metric-label">Inventory Value</div>
                <div className="metric-value">
                  ${Number(report.metrics?.totalValue || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <section className="ai-report-card" style={{ marginTop: '1rem' }}>
              <h3>Report</h3>
              <div className="ai-report-body">{report.report || 'No report text available.'}</div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}

