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
import { Plus, Edit2, Trash2, Search, Mail, Phone } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contact_email: string;
  phone: string;
  created_at: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const filtered = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/suppliers?user_only=true');
      setSuppliers(response.data || []);
    } catch (error) {
      toast.error('Failed to load suppliers');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/suppliers', {
        name: formData.name,
        contact_email: formData.contact_email,
        phone: formData.phone,
      });
      toast.success('Supplier created successfully');
      setFormData({
        name: '',
        contact_email: '',
        phone: '',
      });
      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create supplier');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await apiClient.delete(`/suppliers/${id}`);
        toast.success('Supplier deleted successfully');
        fetchSuppliers();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete supplier');
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground mt-1">Manage your supplier network</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>Add a new supplier to your network</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier Name *</label>
                  <Input
                    placeholder="e.g., ABC Supplies Inc."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Email</label>
                  <Input
                    type="email"
                    placeholder="contact@supplier.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Create Supplier
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No suppliers found. Create your first supplier to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {supplier.contact_email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${supplier.contact_email}`}
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {supplier.contact_email}
                        </a>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${supplier.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(supplier.id)}
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
