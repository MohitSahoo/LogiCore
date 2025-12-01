import { useEffect, useState } from 'react';
import axios from 'axios';

export default function InventoryView({ apiBase }) {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('valuation'); // 'valuation' or 'movements'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, movementsRes] = await Promise.all([
        axios.get(`${apiBase}/reports/inventory`),
        axios.get(`${apiBase}/reports/movements`),
      ]);
      setProducts(productsRes.data || []);
      setMovements(movementsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatCurrency = (value) => {
    return `$${Number(value).toFixed(2)}`;
  };

  // Calculate totals
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.stock_quantity) * Number(p.unit_price),
    0
  );

  const totalUnits = products.reduce((sum, p) => sum + Number(p.stock_quantity), 0);

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  return (
    <div className="view">
      <div className="view-header">
        <h2>📦 Inventory Management</h2>
        <div className="view-actions">
          <button
            onClick={() => setActiveView('valuation')}
            className={activeView === 'valuation' ? 'btn-primary' : 'btn-secondary'}
          >
            💰 Valuation
          </button>
          <button
            onClick={() => setActiveView('movements')}
            className={activeView === 'movements' ? 'btn-primary' : 'btn-secondary'}
          >
            📊 Movements
          </button>
          <button onClick={fetchData} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {activeView === 'valuation' ? (
        <>
          {/* Summary Cards */}
          <div className="inventory-summary">
            <div className="summary-card total">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <div className="summary-label">Total Inventory Value</div>
                <div className="summary-value">{formatCurrency(totalInventoryValue)}</div>
              </div>
            </div>
            <div className="summary-card units">
              <div className="summary-icon">📦</div>
              <div className="summary-content">
                <div className="summary-label">Total Units</div>
                <div className="summary-value">{totalUnits.toLocaleString()}</div>
              </div>
            </div>
            <div className="summary-card products">
              <div className="summary-icon">🏷️</div>
              <div className="summary-content">
                <div className="summary-label">Total Products</div>
                <div className="summary-value">{products.length}</div>
              </div>
            </div>
            <div className="summary-card avg">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <div className="summary-label">Avg Value per Product</div>
                <div className="summary-value">
                  {formatCurrency(products.length > 0 ? totalInventoryValue / products.length : 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Valuation Table */}
          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Supplier</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Total Value</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalValue = Number(product.stock_quantity) * Number(product.unit_price);
                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>
                        <code className="sku-badge">{product.sku}</code>
                      </td>
                      <td>{product.supplier_name || 'N/A'}</td>
                      <td className="text-right">{formatCurrency(product.unit_price)}</td>
                      <td className="text-right">
                        <span className="quantity-badge">{product.stock_quantity}</span>
                      </td>
                      <td className="text-right">
                        <strong className="total-value">{formatCurrency(totalValue)}</strong>
                      </td>
                      <td className="text-center">
                        {product.is_low_stock ? (
                          <span className="status-badge low-stock">⚠️ Low Stock</span>
                        ) : product.stock_quantity > product.reorder_level * 3 ? (
                          <span className="status-badge overstock">📦 Overstock</span>
                        ) : (
                          <span className="status-badge healthy">✓ Healthy</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="4">
                    <strong>GRAND TOTAL</strong>
                  </td>
                  <td className="text-right">
                    <strong>{totalUnits.toLocaleString()} units</strong>
                  </td>
                  <td className="text-right">
                    <strong className="grand-total">{formatCurrency(totalInventoryValue)}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Movements View */}
          {movements.length === 0 ? (
            <div className="empty-state">
              <p>No inventory movements recorded yet.</p>
              <p className="text-muted">
                Movements are automatically logged when orders are completed or stock is adjusted.
              </p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-center">Change</th>
                      <th className="text-right">Current Stock</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{formatDate(movement.created_at)}</td>
                        <td>{movement.product_name}</td>
                        <td>
                          <code className="sku-badge">{movement.sku}</code>
                        </td>
                        <td className="text-center">
                          <span
                            className={
                              movement.change_qty > 0 ? 'badge-success' : 'badge-danger'
                            }
                          >
                            {movement.change_qty > 0 ? '+' : ''}
                            {movement.change_qty}
                          </span>
                        </td>
                        <td className="text-right">{movement.stock_quantity}</td>
                        <td>{movement.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="stats-summary">
                <div className="stat-card">
                  <div className="stat-label">Total Movements</div>
                  <div className="stat-value">{movements.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Stock Decreases</div>
                  <div className="stat-value">
                    {movements.filter((m) => m.change_qty < 0).length}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Stock Increases</div>
                  <div className="stat-value">
                    {movements.filter((m) => m.change_qty > 0).length}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
