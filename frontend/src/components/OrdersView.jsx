import { useEffect, useState } from 'react';
import axios from 'axios';

export default function OrdersView({ apiBase, onChange, products }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    status: 'PENDING',
    items: []
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const addItemRow = () => {
    if (products.length === 0) {
      alert('No products available. Please add products first.');
      return;
    }
    setForm({
      ...form,
      items: [...form.items, { 
        product_id: products[0]?.id || '', 
        quantity: 1, 
        unit_price: products[0]?.unit_price || 0 
      }]
    });
  };

  const removeItem = (index) => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    
    // Auto-update price when product changes
    if (field === 'product_id') {
      const product = products.find(p => p.id === Number(value));
      if (product) {
        items[index].unit_price = product.unit_price;
      }
    }
    
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.items.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }
    
    try {
      setLoading(true);
      const payload = {
        customer_name: form.customer_name,
        status: form.status,
        items: form.items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price)
        }))
      };
      await axios.post(`${apiBase}/orders`, payload);
      setForm({ customer_name: '', status: 'PENDING', items: [] });
      setShowForm(false);
      await loadOrders();
      onChange();
      alert('Order created successfully!');
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, currentStatus) => {
    if (currentStatus === status) {
      alert(`Order is already ${status}`);
      return;
    }
    
    const confirmMsg = status === 'COMPLETED' 
      ? 'Mark this order as COMPLETED? This will deduct inventory.'
      : `Change order status to ${status}?`;
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      setLoading(true);
      await axios.put(`${apiBase}/orders/${id}`, { status });
      await loadOrders();
      onChange();
      alert(`Order status updated to ${status}`);
    } catch (err) {
      console.error('Failed to update order:', err);
      alert('Failed to update order: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id, orderNumber) => {
    if (!window.confirm(`Delete order ${orderNumber}? This action cannot be undone.`)) return;
    
    try {
      setLoading(true);
      await axios.delete(`${apiBase}/orders/${id}`);
      await loadOrders();
      onChange();
      alert('Order deleted successfully');
    } catch (err) {
      console.error('Failed to delete order:', err);
      alert('Failed to delete order: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'badge-warning',
      'COMPLETED': 'badge-success',
      'CANCELLED': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unit_price));
    }, 0).toFixed(2);
  };

  return (
    <div className="view">
      <div className="view-header">
        <h2>📋 Orders Management</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary"
          disabled={loading}
        >
          {showForm ? '✕ Cancel' : '+ New Order'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>Create New Order</h3>
          <form onSubmit={handleSubmit} className="form-modern">
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name *</label>
                <input 
                  type="text"
                  value={form.customer_name} 
                  onChange={e => setForm({ ...form, customer_name: e.target.value })} 
                  placeholder="Enter customer name"
                  required 
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Initial Status</label>
                <select 
                  value={form.status} 
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  disabled={loading}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="order-items-section">
              <div className="section-header">
                <h4>Order Items</h4>
                <button 
                  type="button" 
                  onClick={addItemRow} 
                  className="btn-secondary"
                  disabled={products.length === 0 || loading}
                >
                  + Add Item
                </button>
              </div>

              {form.items.length === 0 ? (
                <div className="empty-state">
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              ) : (
                <div className="order-items-list">
                  {form.items.map((item, idx) => {
                    const product = products.find(p => p.id === Number(item.product_id));
                    const itemTotal = (Number(item.quantity) * Number(item.unit_price)).toFixed(2);
                    
                    return (
                      <div key={idx} className="order-item-card">
                        <div className="item-number">{idx + 1}</div>
                        <div className="item-fields">
                          <div className="form-group">
                            <label>Product</label>
                            <select
                              value={item.product_id}
                              onChange={e => updateItem(idx, 'product_id', e.target.value)}
                              required
                              disabled={loading}
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku}) - Stock: {p.stock_quantity}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={product?.stock_quantity || 999}
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', e.target.value)}
                              required
                              disabled={loading}
                            />
                          </div>
                          <div className="form-group">
                            <label>Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                              required
                              disabled={loading}
                            />
                          </div>
                          <div className="form-group">
                            <label>Subtotal</label>
                            <div className="item-total">${itemTotal}</div>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeItem(idx)}
                          className="btn-remove"
                          disabled={loading}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {form.items.length > 0 && (
                <div className="order-total">
                  <strong>Total Amount:</strong>
                  <span className="total-value">${calculateTotal()}</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setForm({ customer_name: '', status: 'PENDING', items: [] });
                }}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={form.items.length === 0 || loading}
              >
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>All Orders</h3>
          <button onClick={loadOrders} className="btn-secondary" disabled={loading}>
            🔄 Refresh
          </button>
        </div>

        {loading && <div className="loading">Loading orders...</div>}

        {!loading && orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found. Create your first order to get started!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number}</strong>
                    </td>
                    <td>{order.customer_name}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-center">{order.item_count}</td>
                    <td className="text-right">
                      <strong>${Number(order.total_amount || 0).toFixed(2)}</strong>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        {order.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => updateStatus(order.id, 'COMPLETED', order.status)}
                            className="btn-success btn-sm"
                            disabled={loading}
                            title="Mark as completed"
                          >
                            ✓ Complete
                          </button>
                        )}
                        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => updateStatus(order.id, 'CANCELLED', order.status)}
                            className="btn-warning btn-sm"
                            disabled={loading}
                            title="Cancel order"
                          >
                            ✕ Cancel
                          </button>
                        )}
                        <button 
                          onClick={() => deleteOrder(order.id, order.order_number)}
                          className="btn-danger btn-sm"
                          disabled={loading}
                          title="Delete order"
                        >
                          🗑 Delete
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