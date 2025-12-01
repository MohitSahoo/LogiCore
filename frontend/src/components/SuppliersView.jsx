import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SuppliersView({ apiBase, onChange }) {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    contact_email: '',
    phone: '',
    address: ''
  });

  const loadSuppliers = async () => {
    const res = await axios.get(`${apiBase}/suppliers`);
    setSuppliers(res.data);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${apiBase}/suppliers`, form);
    setForm({ name: '', contact_email: '', phone: '', address: '' });
    await loadSuppliers();
    onChange();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    await axios.delete(`${apiBase}/suppliers/${id}`);
    await loadSuppliers();
    onChange();
  };

  return (
    <div className="panel">
      <section>
        <h2>Suppliers</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Products</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.contact_email}</td>
                <td>{s.phone}</td>
                <td>{s.product_count}</td>
                <td>
                  <button onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Add Supplier</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Email
            <input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            Address
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </label>
          <button type="submit">Create Supplier</button>
        </form>
      </section>
    </div>
  );
}