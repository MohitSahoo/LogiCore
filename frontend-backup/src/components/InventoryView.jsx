import { useEffect, useState } from 'react';
import axios from 'axios';

export default function InventoryView({ apiBase, dataChangeCounter }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${apiBase}/reports/inventory`, {
        headers: {
          'Cache-Control': 'no-cache'
        },
        params: {
          _t: Date.now()
        }
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Refresh when suppliers change (affects supplier names in inventory)
  useEffect(() => {
    if (dataChangeCounter > 0) {
      load();
    }
  }, [dataChangeCounter]);

  const lowStockCount = items.filter(i => i.is_low_stock).length;
  const totalStock = items.reduce((sum, i) => sum + (i.stock_quantity || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventory</h1>
          <p>{items.length} items · {totalStock.toLocaleString()} units</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary */}
      {!loading && items.length > 0 && (
        <div className="metrics-row" style={{ marginBottom: 24 }}>
          <div className="metric-card">
            <div className="metric-label">Total Items</div>
            <div className="metric-value">{items.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Units</div>
            <div className="metric-value">{totalStock.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Low Stock</div>
            <div className="metric-value" style={{ color: lowStockCount > 0 ? '#fbbf24' : 'inherit' }}>
              {lowStockCount}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Healthy</div>
            <div className="metric-value" style={{ color: '#4ade80' }}>
              {items.length - lowStockCount}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No inventory items</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Supplier</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Reorder</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ color: '#4b5563' }}>{item.id}</td>
                    <td>{item.name}</td>
                    <td style={{ fontWeight: 500, color: '#a5b4fc' }}>{item.sku}</td>
                    <td style={{ color: '#6b7280' }}>{item.supplier_name || '—'}</td>
                    <td className="text-right" style={{ fontWeight: 500 }}>{item.stock_quantity}</td>
                    <td className="text-right" style={{ color: '#6b7280' }}>{item.reorder_level}</td>
                    <td>
                      <span className={`badge ${item.is_low_stock ? 'badge-warning' : 'badge-success'}`}>
                        {item.is_low_stock ? 'Low' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
