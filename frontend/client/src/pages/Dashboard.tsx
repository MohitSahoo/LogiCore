import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { apiClient } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Package, ShoppingCart, AlertCircle, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalOrders: number;
  totalSuppliers: number;
  inventoryValue: number;
  totalRevenue: number;
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
    inventoryValue: 0,
    totalRevenue: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState(user?.role);

  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Watch for role changes and refresh dashboard
  useEffect(() => {
    if (user?.role && user.role !== currentRole) {
      console.log(`🔄 Role changed from ${currentRole} to ${user.role}, refreshing dashboard...`);
      setCurrentRole(user.role);
      fetchDashboardData();
    }
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching dashboard data...');
      console.log('🔑 Current API headers:', apiClient.defaults.headers.common);
      
      const [productsRes, ordersRes, suppliersRes, alertsRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/orders'),
        apiClient.get('/suppliers'),
        apiClient.get('/reports/alerts'),
      ]);

      console.log('✅ Dashboard data fetched successfully');
      console.log('📦 Products:', productsRes.data?.length || 0);
      console.log('📋 Orders:', ordersRes.data?.length || 0);
      console.log('🏭 Suppliers:', suppliersRes.data?.length || 0);
      console.log('🚨 Alerts:', alertsRes.data?.length || 0);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const suppliers = suppliersRes.data || [];
      const alerts = alertsRes.data || [];

      const lowStockCount = alerts.length;
      
      // Calculate inventory value (stock_quantity * unit_price for all products)
      const inventoryValue = products.reduce((sum: number, product: any) => {
        const quantity = parseFloat(product.stock_quantity) || 0;
        const price = parseFloat(product.unit_price) || 0;
        return sum + (quantity * price);
      }, 0);
      
      // Calculate total revenue (sum of COMPLETED order totals only)
      const totalRevenue = orders
        .filter((order: any) => order.status === 'COMPLETED')
        .reduce((sum: number, order: any) => {
          const amount = parseFloat(order.total_amount) || 0;
          return sum + amount;
        }, 0);

      setStats({
        totalProducts: products.length,
        lowStockItems: lowStockCount,
        totalOrders: orders.length,
        totalSuppliers: suppliers.length,
        inventoryValue: inventoryValue,
        totalRevenue: totalRevenue,
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
      console.error('❌ Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
              {user?.role === 'admin' && <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">Admin View</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchDashboardData();
                toast.success('Dashboard refreshed');
              }}
              className="hover:bg-orange-50 dark:hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setLocation('/products')}
              className="bg-primary hover:bg-primary/90"
            >
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.inventoryValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total stock value
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From all orders
              </p>
            </CardContent>
          </Card>

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
                All time
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
