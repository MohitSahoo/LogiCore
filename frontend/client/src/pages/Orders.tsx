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
import { Plus, Eye, Trash2, Search, ShoppingCart, X, Package, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: number;
  order_number?: string;
  customer_name: string;
  status: string;
  total_amount: string; // Comes as string from database
  item_count: number;
  created_at: string;
  user_name?: string; // Name of user who created the order
  user_email?: string; // Email of user who created the order
  user_id?: number; // ID of user who created the order
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_price: string;
  stock_quantity: number;
  supplier_name: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_email: string;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  total: number;
}

export default function Orders() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [formData, setFormData] = useState({
    order_number: '',
    customer_name: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toString().includes(searchTerm) ||
        (o.order_number && o.order_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/orders');
      console.log('📦 Orders API Response:', response.data);
      console.log('📦 First order total_amount:', response.data[0]?.total_amount, 'Type:', typeof response.data[0]?.total_amount);
      
      // Ensure all orders have valid total_amount
      const ordersWithValidTotals = (response.data || []).map(order => ({
        ...order,
        total_amount: order.total_amount || '0.00'
      }));
      
      console.log('📦 After processing, first order:', ordersWithValidTotals[0]);
      setOrders(ordersWithValidTotals);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/suppliers');
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const addProductToOrder = (product: Product) => {
    const existingItem = selectedItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Increase quantity if product already exists
      setSelectedItems(items =>
        items.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
            : item
        )
      );
    } else {
      // Add new product
      const newItem: OrderItem = {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: parseFloat(product.unit_price),
        quantity: 1,
        total: parseFloat(product.unit_price),
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setSelectedItems(items =>
      items.map(item =>
        item.product_id === productId
          ? { ...item, quantity, total: quantity * item.unit_price }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setSelectedItems(items => items.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const resetForm = () => {
    setFormData({
      order_number: '',
      customer_name: '',
      status: 'pending',
    });
    setSelectedItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error('Please add at least one product to the order');
      return;
    }

    try {
      const orderData = {
        order_number: formData.order_number || `ORD-${Date.now()}`,
        customer_name: formData.customer_name,
        status: formData.status.toUpperCase(), // Convert to uppercase for database
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price.toString(), // Convert to string for database
        })),
      };

      await apiClient.post('/orders', orderData);
      toast.success('Order created successfully');
      resetForm();
      setIsDialogOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create order');
    }
  };

  const handleDelete = async (id: number) => {
    // Find the order to get more details for the confirmation
    const orderToDelete = filteredOrders.find(order => order.id === id);
    const orderInfo = orderToDelete ? `Order #${orderToDelete.id} (${orderToDelete.customer_name})` : `Order #${id}`;
    
    if (confirm(`Are you sure you want to delete ${orderInfo}?\n\nThis action cannot be undone.`)) {
      try {
        await apiClient.delete(`/orders/${id}`);
        toast.success('Order deleted successfully');
        fetchOrders();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete order');
      }
    }
  };
  
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    const order = filteredOrders.find(o => o.id === id);
    const statusMessages: Record<string, string> = {
      'COMPLETED': 'This will reduce inventory stock. Continue?',
      'CANCELLED': 'Cancel this order?',
      'PENDING': 'Set order back to pending?'
    };
    
    const message = statusMessages[newStatus] || 'Update order status?';
    
    if (confirm(`${message}\n\nOrder: ${order?.customer_name || id}`)) {
      try {
        console.log(`🔄 Updating order ${id} to ${newStatus}`);
        console.log('📤 Request headers:', apiClient.defaults.headers);
        
        const response = await apiClient.put(`/orders/${id}`, { status: newStatus });
        console.log('✅ Update response:', response.data);
        
        toast.success(`Order ${newStatus.toLowerCase()} successfully`);
        fetchOrders();
      } catch (error: any) {
        console.error('❌ Update failed:', error);
        console.error('Response:', error.response?.data);
        console.error('Status:', error.response?.status);
        
        const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to update order';
        toast.error(errorMessage);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Create a comprehensive order with products, suppliers, and cost details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Name *</label>
                    <Input
                      placeholder="e.g., Monthly Inventory Restock"
                      value={formData.order_number}
                      onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input
                      placeholder="e.g., John Doe"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Add Products</h3>
                    <span className="text-sm text-muted-foreground">
                      {products.length} products available
                    </span>
                  </div>
                  
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {products.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No products available</p>
                    ) : (
                      <div className="space-y-2">
                        {products.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    SKU: {product.sku} | Stock: {product.stock_quantity} | ${parseFloat(product.unit_price).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Supplier: {product.supplier_name}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addProductToOrder(product)}
                              disabled={product.stock_quantity === 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Items */}
                {selectedItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Selected Products</h3>
                    <div className="border rounded-lg">
                      <div className="p-4 space-y-3">
                        {selectedItems.map((item) => (
                          <div key={item.product_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {item.product_sku} | ${item.unit_price.toFixed(2)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                              <div className="text-right min-w-[80px]">
                                <p className="font-medium">${item.total.toFixed(2)}</p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => removeItem(item.product_id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Order Summary */}
                      <div className="border-t p-4 bg-muted/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {selectedItems.length} product{selectedItems.length !== 1 ? 's' : ''} • {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} total items
                            </p>
                            <div className="mt-1">
                              <p className="text-xs text-muted-foreground">
                                Suppliers: {Array.from(new Set(selectedItems.map(item => {
                                  const product = products.find(p => p.id === item.product_id);
                                  return product?.supplier_name || 'Unknown';
                                }))).join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              ${calculateTotal().toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Cost</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={selectedItems.length === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Create Order (${calculateTotal().toFixed(2)})
                  </Button>
                </div>
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
                  {console.log(`Rendering order ${order.id}, total_amount:`, order.total_amount, 'Type:', typeof order.total_amount)}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">Order #{order.id}</h3>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                          {isAdmin && order.user_name && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Created by: {order.user_name}
                              </p>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Items</p>
                          <p className="font-medium text-foreground">{order.item_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium text-foreground">
                            ${(() => {
                              const amount = order.total_amount;
                              if (!amount || amount === null || amount === undefined) return '0.00';
                              if (typeof amount === 'string') return amount;
                              if (typeof amount === 'number') return amount.toFixed(2);
                              return '0.00';
                            })()}
                          </p>
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
                      {/* Status Update Buttons */}
                      {order.status.toUpperCase() === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200"
                            title="Mark as completed (reduces inventory)"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200"
                            title="Cancel order"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {order.status.toUpperCase() === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'PENDING')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200"
                          title="Set back to pending (restores inventory)"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status.toUpperCase() === 'CANCELLED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'PENDING')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200"
                          title="Reopen order"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* View Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/orders/${order.id}`)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="View order details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Delete Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200"
                        onClick={() => handleDelete(order.id)}
                        title="Delete order"
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
