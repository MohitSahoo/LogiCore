import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Search } from 'lucide-react';
import { useLocation } from 'wouter';

interface Order {
  id: number;
  customer_name: string;
  status: string;
  total_amount: number;
  item_count: number;
  created_at: string;
}

export default function Orders() {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toString().includes(searchTerm)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/orders?user_only=true');
      setOrders(response.data || []);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/orders', {
        customer_name: formData.customer_name,
        status: formData.status,
        items: [],
      });
      toast.success('Order created successfully');
      setFormData({
        customer_name: '',
        status: 'pending',
      });
      setIsDialogOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create order');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await apiClient.delete(`/orders/${id}`);
        toast.success('Order deleted successfully');
        fetchOrders();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete order');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage and track your orders</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Create a new order for your customers</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name *</label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Create Order
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No orders found. Create your first order to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">Order #{order.id}</h3>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Items</p>
                          <p className="font-medium text-foreground">{order.item_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium text-foreground">${parseFloat(order.total_amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium text-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/orders/${order.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
