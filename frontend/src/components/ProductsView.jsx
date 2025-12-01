import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ProductsView({ apiBase, onChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    supplier_id: '',
    unit_price: 0,
    stock_quantity: 0,
    reorder_level: 10
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${apiBase}/reports/inventory`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      await axios.post(`${apiBase}/products`, {
        ...form,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        unit_price: Number(form.unit_price),
        stock_quantity: Number(form.stock_quantity),
        reorder_level: Number(form.reorder_level)
      });
      setForm({
        name: '',
        sku: '',
        description: '',
        supplier_id: '',
        unit_price: 0,
        stock_quantity: 0,
        reorder_level: 10
      });
      setSuccess('Product created successfully!');
      await loadProducts();
      onChange();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleting(id);
      setError(null);
      const response = await axios.delete(`${apiBase}/products/${id}`);
      
      if (response.data?.message) {
        setSuccess(response.data.message);
      } else {
        setSuccess('Product deleted successfully!');
      }
      
      await loadProducts();
      onChange();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      const errorData = err.response?.data;
      
      // Build detailed error message
      let errorMessage = errorData?.error || 'Failed to delete product. Please try again.';
      
      if (errorData?.details) {
        errorMessage += '\n\n' + errorData.details;
      }
      
      if (errorData?.orderNumbers && errorData.orderNumbers.length > 0) {
        errorMessage += `\n\nOrder(s): ${errorData.orderNumbers.join(', ')}`;
      }
      
      setError(errorMessage);
      
      // Also show in alert for visibility
      alert(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="products-view">
      {error && (
        <div className="alert alert-error">
          <div className="alert-message">{error}</div>
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <div className="alert-message">{success}</div>
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      <div className="products-layout">
        <section className="products-table-section">
          <div className="section-header">
            <h2>Products</h2>
            <button onClick={loadProducts} className="btn-refresh" disabled={loading}>
              {loading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>
          
          {loading && products.length === 0 ? (
            <div className="loading-state">
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Supplier</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Reorder</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-state-cell">
                        <div className="empty-state">
                          <p>No products found.</p>
                          <p className="text-muted">Add your first product using the form on the right.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className={p.is_low_stock ? 'low-stock-row' : ''}>
                        <td className="id-cell">{p.id}</td>
                        <td className="name-cell">
                          <div className="product-name">{p.name}</div>
                          {p.description && (
                            <div className="product-description">{p.description}</div>
                          )}
                        </td>
                        <td>
                          <span className="sku-badge">{p.sku}</span>
                        </td>
                        <td>{p.supplier_name || <span className="text-muted">—</span>}</td>
                        <td className="price-cell">${Number(p.unit_price).toFixed(2)}</td>
                        <td>
                          <span className="quantity-badge">{p.stock_quantity}</span>
                        </td>
                        <td>{p.reorder_level}</td>
                        <td>
                          <span className={p.is_low_stock ? 'badge-danger' : 'badge-success'}>
                            {p.is_low_stock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="btn-danger btn-sm"
                            type="button"
                            disabled={deleting === p.id}
                          >
                            {deleting === p.id ? 'Deleting...' : '🗑️ Delete'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="products-form-section">
          <h2>Add New Product</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>
                Product Name <span className="required">*</span>
                <input 
                  type="text"
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  required 
                  placeholder="Enter product name"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                SKU <span className="required">*</span>
                <input 
                  type="text"
                  value={form.sku} 
                  onChange={e => setForm({ ...form, sku: e.target.value })} 
                  required 
                  placeholder="e.g., PROD-001"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Description
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  placeholder="Product description (optional)"
                  rows="3"
                />
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Supplier ID
                  <input 
                    type="number"
                    value={form.supplier_id} 
                    onChange={e => setForm({ ...form, supplier_id: e.target.value })} 
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Unit Price ($)
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={form.unit_price} 
                    onChange={e => setForm({ ...form, unit_price: e.target.value })} 
                    placeholder="0.00"
                  />
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Stock Quantity
                  <input 
                    type="number" 
                    min="0"
                    value={form.stock_quantity} 
                    onChange={e => setForm({ ...form, stock_quantity: e.target.value })} 
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Reorder Level
                  <input 
                    type="number" 
                    min="0"
                    value={form.reorder_level} 
                    onChange={e => setForm({ ...form, reorder_level: e.target.value })} 
                    placeholder="10"
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-submit">
              ➕ Create Product
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}