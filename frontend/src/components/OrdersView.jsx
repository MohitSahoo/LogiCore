import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function OrdersView({ apiBase, onChange, products }) {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    customer_name: '',
    status: 'PENDING',
    items: []
  });

  const loadOrders = async () => {
    const res = await axios.get(`${apiBase}/orders`);
    setOrders(res.data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const addItemRow = () => {
    setForm({
      ...form,
      items: [...form.items, { product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.unit_price || 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    await loadOrders();
    onChange();
  };

  const updateStatus = async (id, status) => {
    await axios.put(`${apiBase}/orders/${id}`, { status });
    await loadOrders();
    onChange();
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    await axios.delete(`${apiBase}/orders/${id}`);
    await loadOrders();
    onChange();
  };

  return (
    <div className="panel">
      <section>
        <h2>Orders</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Number</th><th>Customer</th><th>Status</th>
              <th>Total</th><th>Items</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td>{o.status}</td>
                <td>{o.total_amount}</td>
                <td>{o.item_count}</td>
                <td>
                  <button onClick={() => updateStatus(o.id, 'COMPLETED')}>Complete</button>
                  <button onClick={() => updateStatus(o.id, 'CANCELLED')}>Cancel</button>
                  <button onClick={() => deleteOrder(o.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Create Order</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Customer Name
            <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required />
          </label>
          <label>
            Status
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>

          <div className="order-items">
            <h3>Items</h3>
            {form.items.map((item, idx) => (
              <div key={idx} className="order-item-row">
                <select
                  value={item.product_id}
                  onChange={e => updateItem(idx, 'product_id', e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock {p.stock_quantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                />
              </div>
            ))}
            <button type="button" onClick={addItemRow} disabled={products.length === 0}>
              + Add Item
            </button>
          </div>

          <button type="submit" disabled={form.items.length === 0}>Create Order</button>
        </form>
      </section>
    </div>
  );
}