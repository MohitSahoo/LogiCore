import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft } from 'lucide-react';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/orders/${params.id}`);
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to load order');
      setLocation('/orders');
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation('/orders')}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Order #{order.id}</h1>
            <p className="text-muted-foreground mt-1">Order details and items</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">{order.customer_name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-primary">${order.total_amount.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Items included in this order</CardDescription>
          </CardHeader>
          <CardContent>
            {order.items && order.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">SKU</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Quantity</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Unit Price</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-orange-50">
                        <td className="py-3 px-4 text-foreground">{item.product_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.product_sku}</td>
                        <td className="py-3 px-4 text-right text-foreground">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-foreground">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-medium text-foreground">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No items in this order</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/orders')}
          >
            Back to Orders
          </Button>
        </div>
      </div>
    </Layout>
  );
}
