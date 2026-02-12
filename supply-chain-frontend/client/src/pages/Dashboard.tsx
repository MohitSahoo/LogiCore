import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { apiClient } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Package, ShoppingCart, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalOrders: number;
  totalSuppliers: number;
}

interface ChartData {
  name: string;
  value: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalOrders: 0,
    totalSuppliers: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [productsRes, ordersRes, suppliersRes, alertsRes] = await Promise.all([
        apiClient.get('/products?user_only=true'),
        apiClient.get('/orders?user_only=true'),
        apiClient.get('/suppliers?user_only=true'),
        apiClient.get('/reports/alerts'),
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const suppliers = suppliersRes.data || [];
      const alerts = alertsRes.data || [];

      const lowStockCount = alerts.length;

      setStats({
        totalProducts: products.length,
        lowStockItems: lowStockCount,
        totalOrders: orders.length,
        totalSuppliers: suppliers.length,
      });

      // Prepare chart data
      const chartData = [
        { name: 'Products', value: products.length },
        { name: 'Orders', value: orders.length },
        { name: 'Suppliers', value: suppliers.length },
        { name: 'Alerts', value: lowStockCount },
      ];
      setChartData(chartData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your supply chain overview
            </p>
          </div>
          <Button
            onClick={() => setLocation('/products')}
            className="bg-primary hover:bg-primary/90"
          >
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all suppliers
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active suppliers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Your supply chain metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ff8c00" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to key sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation('/products')}
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation('/orders')}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Orders
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation('/suppliers')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Manage Suppliers
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation('/reports')}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
