import React from 'react';

export default function AlertsView({ inventory, alerts }) {
  return (
    <div className="panel">
      <section>
        <h2>Inventory Report</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>SKU</th><th>Supplier</th>
              <th>Price</th><th>Stock</th><th>Reorder</th><th>Low?</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(p => (
              <tr key={p.id} className={p.is_low_stock ? 'low' : ''}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.supplier_name || '-'}</td>
                <td>{p.unit_price}</td>
                <td>{p.stock_quantity}</td>
                <td>{p.reorder_level}</td>
                <td>{p.is_low_stock ? 'YES' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Low-stock Alerts (from trigger)</h2>
        <ul className="alerts-list">
          {alerts.map(a => (
            <li key={a.id}>
              <strong>{a.product_name}</strong> ({a.sku}) – {a.alert_message}
              <span className="ts">{new Date(a.created_at).toLocaleString()}</span>
            </li>
          ))}
          {alerts.length === 0 && <li>No alerts yet.</li>}
        </ul>
      </section>
    </div>
  );
}