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
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useLocation } from 'wouter';

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

export default function Products() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    unit_price: '',
    stock_quantity: '',
    reorder_level: '',
    supplier_id: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/products?user_only=true');
      setProducts(response.data || []);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/products', {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        unit_price: parseFloat(formData.unit_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      });
      toast.success('Product created successfully');
      setFormData({
        name: '',
        sku: '',
        description: '',
        unit_price: '',
        stock_quantity: '',
        reorder_level: '',
        supplier_id: '',
      });
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create product');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete product');
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground mt-1">Manage your product inventory</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Create a new product in your inventory</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <Input
                    placeholder="e.g., Laptop"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU *</label>
                  <Input
                    placeholder="e.g., SKU-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Product description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit Price *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Qty *</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reorder Level *</label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Create Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No products found. Create your first product to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.sku}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="font-medium">${product.unit_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <span className={`font-medium ${product.stock_quantity <= product.reorder_level ? 'text-orange-600' : 'text-green-600'}`}>
                        {product.stock_quantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reorder Level:</span>
                      <span className="font-medium">{product.reorder_level}</span>
                    </div>
                    {product.supplier_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span className="font-medium">{product.supplier_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/products/${product.id}`)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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
