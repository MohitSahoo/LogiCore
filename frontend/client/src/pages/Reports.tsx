import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Alert {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  stock_quantity: number;
  reorder_level: number;
  created_at: string;
}

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  reorder_level: number;
  is_low_stock: boolean;
}

export default function Reports() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const [alertsRes, inventoryRes] = await Promise.all([
        apiClient.get('/reports/alerts'),
        apiClient.get('/reports/inventory'),
      ]);

      setAlerts(alertsRes.data || []);
      setInventory(inventoryRes.data || []);

      // Prepare chart data
      const chartData = (inventoryRes.data || []).map((item: InventoryItem) => ({
        name: item.name,
        current: item.stock_quantity,
        reorder: item.reorder_level,
      }));
      setChartData(chartData);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockCount = inventory.filter((item) => item.is_low_stock).length;
  const totalValue = inventory.reduce((sum, item) => sum + item.stock_quantity, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Inventory analytics and alerts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground mt-1">In inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Require reordering</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalValue}</div>
              <p className="text-xs text-muted-foreground mt-1">Units in stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels Overview</CardTitle>
              <CardDescription>Current vs. Reorder levels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#ff8c00" name="Current Stock" />
                  <Bar dataKey="reorder" fill="#ffc0a0" name="Reorder Level" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Alerts */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>{alerts.length} items below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{alert.product_name}</h4>
                      <p className="text-sm text-muted-foreground">{alert.sku}</p>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span>Current: <span className="font-medium text-orange-600">{alert.stock_quantity}</span></span>
                        <span>Reorder Level: <span className="font-medium">{alert.reorder_level}</span></span>
                      </div>
                    </div>
                    <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Full Inventory</CardTitle>
            <CardDescription>All products in your inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : inventory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No inventory items found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">SKU</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Current Stock</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Reorder Level</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-orange-50">
                        <td className="py-3 px-4 text-foreground">{item.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.sku}</td>
                        <td className="py-3 px-4 text-right text-foreground">{item.stock_quantity}</td>
                        <td className="py-3 px-4 text-right text-foreground">{item.reorder_level}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.is_low_stock
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.is_low_stock ? 'Low Stock' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
