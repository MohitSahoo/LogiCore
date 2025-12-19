import { useEffect, useState } from 'react';
import axios from 'axios';

export default function InventoryView({ apiBase }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📦 Fetching inventory...');
      const res = await axios.get(`${apiBase}/reports/inventory`);
      setItems(res.data || []);
      console.log('✅ Inventory loaded', res.data?.length || 0);
    } catch (err) {
      console.error('Inventory load failed:', err);
      setError(err.response?.data?.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="panel">
      <section>
        <div className="section-header">
          <h2>Inventory</h2>
          <button className="btn-refresh" onClick={load} disabled={loading}>
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
        {error && <div className="banner-error">{error}</div>}
        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>No inventory items found.</p>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Supplier</th>
                <th>Stock</th>
                <th>Reorder</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td><span className="sku-badge">{item.sku}</span></td>
                  <td>{item.supplier_name || '—'}</td>
                  <td>{item.stock_quantity}</td>
                  <td>{item.reorder_level}</td>
                  <td>
                    <span className={item.is_low_stock ? 'badge-danger' : 'badge-success'}>
                      {item.is_low_stock ? 'Low' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

