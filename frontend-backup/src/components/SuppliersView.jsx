import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SuppliersView({ apiBase, onChange }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const API_URL = `${apiBase}/suppliers`;

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(API_URL, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      setSuppliers(response.data);
    } catch (err) {
      setError('Failed to load suppliers');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', contact_email: '', phone: '' });
    setEditingSupplier(null);
    setShowForm(false);
    setError(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name || '',
      contact_email: supplier.contact_email || '',
      phone: supplier.phone || ''
    });
    setEditingSupplier(supplier);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        contact_email: formData.contact_email.trim() || null,
        phone: formData.phone.trim() || null
      };
      
      if (editingSupplier) {
        await axios.put(`${API_URL}/${editingSupplier.id}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }

      await loadSuppliers();
      resetForm();
      
      if (onChange) onChange();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (!confirm(`Delete "${supplier.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      
      await axios.delete(`${API_URL}/${supplier.id}`);

      await loadSuppliers();
      if (onChange) onChange();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete supplier');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Suppliers</h1>
          <p>{suppliers.length} suppliers</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={loadSuppliers} disabled={loading}>
            Refresh
          </button>
          <button className="btn-primary" onClick={handleAdd}>
            Add Supplier
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting || !formData.name.trim()}>
                {submitting ? 'Saving...' : (editingSupplier ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <h3 style={{ color: '#e5e7eb', marginBottom: '8px' }}>No suppliers</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Add your first supplier</p>
            <button className="btn-primary" onClick={handleAdd}>Add Supplier</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td style={{ color: '#6b7280' }}>#{supplier.id}</td>
                    <td style={{ fontWeight: '600', color: '#e5e7eb' }}>{supplier.name}</td>
                    <td style={{ color: '#a5b4fc' }}>
                      {supplier.contact_email ? (
                        <a href={`mailto:${supplier.contact_email}`} style={{ color: '#a5b4fc', textDecoration: 'none' }}>
                          {supplier.contact_email}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {supplier.phone ? (
                        <a href={`tel:${supplier.phone}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
                          {supplier.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(supplier)}
                          style={{
                            padding: '4px 8px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '4px',
                            color: '#a5b4fc',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          style={{
                            padding: '4px 8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '4px',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
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
