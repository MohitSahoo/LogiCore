import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SuppliersView({ apiBase, onChange }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏭 Fetching suppliers...');
      const res = await axios.get(`${apiBase}/suppliers`);
      setSuppliers(res.data || []);
      console.log('✅ Suppliers loaded', res.data?.length || 0);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setError(err.response?.data?.error || 'Failed to load suppliers');
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
        <h2>Suppliers</h2>
        {error && <div className="banner-error">{error}</div>}
        {loading ? (
          <div className="loading">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">
            <p>No suppliers found.</p>
            <p className="text-muted">Seed data or add suppliers via API.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.contact_email || s.email || '—'}</td>
                  <td>{s.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

