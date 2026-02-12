import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  supplier_id: number;
  supplier_name: string;
}

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    unit_price: '',
    stock_quantity: '',
    reorder_level: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/products/${params.id}`);
      setProduct(response.data);
      setFormData({
        name: response.data.name,
        sku: response.data.sku,
        description: response.data.description || '',
        unit_price: response.data.unit_price.toString(),
        stock_quantity: response.data.stock_quantity.toString(),
        reorder_level: response.data.reorder_level.toString(),
      });
    } catch (error) {
      toast.error('Failed to load product');
      setLocation('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      setIsSaving(true);
      await apiClient.put(`/products/${product.id}`, {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        unit_price: parseFloat(formData.unit_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
      });
      toast.success('Product updated successfully');
      setLocation('/products');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update product');
    } finally {
      setIsSaving(false);
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

  if (!product) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Product not found</p>
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
            onClick={() => setLocation('/products')}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
            <p className="text-muted-foreground mt-1">Update product information</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Edit the product information below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Quantity</label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reorder Level</label>
                  <Input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    required
                  />
                </div>
              </div>

              {product.supplier_name && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Supplier: <span className="font-medium text-foreground">{product.supplier_name}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/products')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
