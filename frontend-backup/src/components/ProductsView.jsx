import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ProductsView({ apiBase = '', onChange, dataChangeCounter }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    supplier_id: '',
    unit_price: '',
    stock_quantity: '',
    reorder_level: ''
  });

  const buildApi = (path) => {
    const p = String(path).replace(/^\//, '');
    const base = String(apiBase || '').replace(/\/$/, '');
    if (base.endsWith('/api')) return `${base}/${p.replace(/^api\//, '')}`;
    if (p.startsWith('api/')) return base ? `${base}/${p}` : `/${p}`;
    return base ? `${base}/api/${p}` : `/api/${p}`;
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(buildApi('products'), {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        params: {
          _t: Date.now() // Cache buster
        }
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(buildApi('suppliers'), {
        headers: {
          'Cache-Control': 'no-cache'
        },
        params: {
          _t: Date.now()
        }
      });
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch { }
  };

  // Listen for changes from parent (e.g., when suppliers are updated)
  useEffect(() => {
    fetchSuppliers(); // Refresh suppliers when dataChangeCounter changes
  }, [dataChangeCounter]);

  const resetForm = () => {
    setFormData({
      name: '', sku: '', description: '', supplier_id: '',
      unit_price: '', stock_quantity: '', reorder_level: ''
    });
    setEditingProduct(null);
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || null,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        unit_price: parseFloat(formData.unit_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        reorder_level: parseInt(formData.reorder_level, 10) || 0
      };

      if (editingProduct) {
        await axios.put(buildApi(`products/${editingProduct.id}`), payload);
        setSuccess('Product updated');
      } else {
        await axios.post(buildApi('products'), payload);
        setSuccess('Product created');
      }

      await fetchProducts();
      onChange?.();
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      supplier_id: product.supplier_id ?? '',
      unit_price: product.unit_price ?? '',
      stock_quantity: product.stock_quantity ?? '',
      reorder_level: product.reorder_level ?? ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await axios.delete(buildApi(`products/${id}`));
      await fetchProducts();
      onChange?.();
      setSuccess('Product deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const getStockBadge = (p) => {
    const rq = Number(p.reorder_level || 0);
    const sq = Number(p.stock_quantity || 0);
    if (sq <= rq) return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <p>{products.length} items</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={fetchProducts} disabled={loading}>
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form */}
      {showForm && (
        <div className="card card-padded" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{editingProduct ? 'Edit Product' : 'New Product'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={formData.name} required
                  onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input className="form-input" value={formData.sku} required
                  onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Price</label>
                <input className="form-input" type="number" step="0.01" value={formData.unit_price}
                  onChange={e => setFormData({ ...formData, unit_price: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input className="form-input" type="number" value={formData.stock_quantity}
                  onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input className="form-input" type="number" value={formData.reorder_level}
                  onChange={e => setFormData({ ...formData, reorder_level: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-select" value={formData.supplier_id}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}>
                  <option value="">None</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows="2" value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Supplier</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500, color: '#a5b4fc' }}>{p.sku}</td>
                    <td>{p.name}</td>
                    <td style={{ color: '#6b7280' }}>{p.supplier_name || '—'}</td>
                    <td className="text-right">${Number(p.unit_price || 0).toFixed(2)}</td>
                    <td className="text-right">{p.stock_quantity}</td>
                    <td>
                      <span className={`badge ${getStockBadge(p)}`}>
                        {p.stock_quantity <= p.reorder_level ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="btn-ghost btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn-ghost btn-sm" style={{ color: '#f87171' }}
                        onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>
                        Delete
                      </button>
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
