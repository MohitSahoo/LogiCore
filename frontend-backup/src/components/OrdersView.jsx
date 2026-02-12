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
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const addItemRow = () => {
    if (!products?.length) return alert('No products available.');
    setForm({
      ...form,
      items: [...form.items, {
        product_id: products[0].id,
        quantity: 1,
        unit_price: products[0].unit_price
      }]
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'product_id') {
      const p = products.find(x => x.id === Number(value));
      if (p) items[index].unit_price = p.unit_price;
    }
    setForm({ ...form, items });
  };

  const removeItem = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const calculateTotal = () =>
    form.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.items.length) return alert('Add at least one item');
    try {
      setLoading(true);
      await axios.post(`${apiBase}/orders`, {
        customer_name: form.customer_name,
        status: form.status,
        items: form.items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price)
        }))
      });
      setForm({ customer_name: '', status: 'PENDING', items: [] });
      setShowForm(false);
      await loadOrders();
      onChange();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Change status to ${status}?`)) return;
    try {
      setLoading(true);
      await axios.put(`${apiBase}/orders/${id}`, { status });
      await loadOrders();
      onChange();
    } catch {
      alert('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      setLoading(true);
      await axios.delete(`${apiBase}/orders/${id}`);
      await loadOrders();
      onChange();
    } catch {
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) =>
    s === 'COMPLETED' ? 'badge-success' :
      s === 'CANCELLED' ? 'badge-danger' : 'badge-warning';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Orders</h1>
          <p>{orders.length} orders</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={loadOrders}>Refresh</button>
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New Order'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card card-padded" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>New Order</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input className="form-input" value={form.customer_name} required
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Enter name" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="order-items-panel">
              <div className="order-items-header">
                <h4>Items</h4>
                <button type="button" className="btn-ghost btn-sm" onClick={addItemRow}>+ Add</button>
              </div>

              {form.items.length === 0 ? (
                <p style={{ color: '#4b5563', fontSize: '0.8125rem', textAlign: 'center', padding: 16 }}>
                  No items added
                </p>
              ) : (
                <>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <div className="order-item-num">{idx + 1}</div>
                      <div className="order-item-fields">
                        <div className="form-group">
                          <label className="form-label">Product</label>
                          <select className="form-select" value={item.product_id}
                            onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Qty</label>
                          <input className="form-input" type="number" min="1" value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Price</label>
                          <input className="form-input" type="number" step="0.01" value={item.unit_price}
                            onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Subtotal</label>
                          <div className="order-item-subtotal">
                            ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <button type="button" className="btn-ghost btn-sm" style={{ color: '#f87171' }}
                        onClick={() => removeItem(idx)}>Remove</button>
                    </div>
                  ))}
                  <div className="order-total-row">
                    <span className="order-total-label">Total</span>
                    <span className="order-total-value">${calculateTotal()}</span>
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>Create Order</button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty-state"><p>No orders yet</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Total</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 500, color: '#a5b4fc' }}>{o.order_number}</td>
                    <td>{o.customer_name}</td>
                    <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                    <td className="text-right">{o.item_count}</td>
                    <td className="text-right" style={{ fontWeight: 500 }}>
                      ${Number(o.total_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button className="btn-ghost btn-sm"
                        onClick={() => updateStatus(o.id, 'COMPLETED')}
                        disabled={o.status === 'COMPLETED'}>
                        Complete
                      </button>
                      <button className="btn-ghost btn-sm" style={{ color: '#f87171' }}
                        onClick={() => deleteOrder(o.id)}>
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
