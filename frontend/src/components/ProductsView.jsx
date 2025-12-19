import React, { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * ProductsView
 *
 * Props:
 *  - apiBase (string) optional. Example values:
 *      ''                 -> buildApi('products') => '/api/products' (works with dev proxy)
 *      '/api'             -> buildApi('products') => '/api/products'
 *      'http://host:4000' -> buildApi('products') => 'http://host:4000/api/products'
 *  - onChange() optional callback invoked after create/update/delete
 */
export default function ProductsView({ apiBase = '', onChange }) {
  // UI state
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    supplier_id: '',
    unit_price: '',
    stock_quantity: '',
    reorder_level: ''
  });

  // Helper to build API URLs safely (avoid double /api)
  const buildApi = (path) => {
    // normalize path (no leading slash)
    const p = String(path).replace(/^\//, '');
    const base = String(apiBase || '').replace(/\/$/, '');

    // If base already ends with '/api', avoid adding another '/api'
    if (base.endsWith('/api')) {
      return `${base}/${p.replace(/^api\//, '')}`;
    }

    // If path already begins with 'api/', just join
    if (p.startsWith('api/')) {
      return base ? `${base}/${p}` : `/${p}`;
    }

    // otherwise, add '/api' prefix
    return base ? `${base}/api/${p}` : `/api/${p}`;
  };

  // Fetch products & suppliers on mount
  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(buildApi('products'));
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.error || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(buildApi('suppliers'));
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Suppliers are non-fatal for the component; just warn
      console.warn('Error fetching suppliers:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      supplier_id: '',
      unit_price: '',
      stock_quantity: '',
      reorder_level: ''
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
        setSuccess('Product updated successfully');
      } else {
        await axios.post(buildApi('products'), payload);
        setSuccess('Product created successfully');
      }

      await fetchProducts();
      onChange?.();
      setTimeout(() => setSuccess(null), 3000);
      resetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save product.');
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
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    setError(null);
    try {
      await axios.delete(buildApi(`products/${id}`));
      setSuccess('Product deleted successfully');
      await fetchProducts();
      onChange?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting product:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to delete product.';
      setError(msg);
      alert(msg);
    } finally {
      setDeleting(null);
    }
  };

  const getStockStatus = (product) => {
    const rq = Number(product.reorder_level || 0);
    const sq = Number(product.stock_quantity || 0);
    if (sq <= rq) return { status: 'Low Stock', className: 'status-low' };
    if (rq > 0 && sq > rq * 3) return { status: 'Overstock', className: 'status-over' };
    return { status: 'Good', className: 'status-good' };
  };

  return (
    <div className="products-view">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📦 Products</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-primary"
            onClick={() => { setShowForm((s) => !s); setError(null); }}
            disabled={loading}
          >
            {showForm ? '✕ Cancel' : '+ New Product'}
          </button>
          <button className="btn-secondary" onClick={fetchProducts} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '0.75rem 0' }}>
          <div>{error}</div>
          <button onClick={() => setError(null)} style={{ marginLeft: 8 }}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ margin: '0.75rem 0' }}>
          <div>{success}</div>
          <button onClick={() => setSuccess(null)} style={{ marginLeft: 8 }}>×</button>
        </div>
      )}

      {showForm && (
        <div className="form-card" style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #eee', borderRadius: 6 }}>
          <h3 style={{ marginTop: 0 }}>{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Supplier</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                >
                  <option value="">-- No Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container" style={{ marginTop: 12 }}>
        <table className="products-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>SKU</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Supplier</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Unit Price</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Stock</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Reorder</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}><strong>{product.sku}</strong></td>
                    <td style={{ padding: 8 }}>{product.name}</td>
                    <td style={{ padding: 8 }}>{product.supplier_name || '-'}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>${(parseFloat(product.unit_price) || 0).toFixed(2)}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{product.stock_quantity}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{product.reorder_level}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <span className={`status-badge ${stockStatus.className}`}>{stockStatus.status}</span>
                    </td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button className="btn-edit" onClick={() => handleEdit(product)} disabled={loading} title="Edit">✏️</button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        title="Delete"
                        style={{ marginLeft: 8 }}
                      >
                        {deleting === product.id ? 'Deleting...' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
