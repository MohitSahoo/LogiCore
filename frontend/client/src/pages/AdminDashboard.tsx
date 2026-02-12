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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Edit2,
  Trash2,
  Search,
  UserCheck,
  UserX,
  Crown,
  Activity,
  Database,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalSuppliers: number;
  totalOrders: number;
  lowStockItems: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    totalOrders: 0,
    lowStockItems: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Debug logging
  console.log('AdminDashboard: Current user:', currentUser);
  console.log('AdminDashboard: User role:', currentUser?.role);

  useEffect(() => {
    // Check if current user is admin
    if (currentUser?.role !== 'admin') {
      console.log('AdminDashboard: Access denied - user is not admin');
      toast.error('Access denied: Admin privileges required');
      return;
    }
    
    console.log('AdminDashboard: User is admin, loading data...');
    fetchAdminStats();
    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to load admin statistics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsUsersLoading(true);
      const response = await apiClient.get('/admin/users');
      setUsers(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (userId: number, updates: { role?: string; is_active?: boolean }) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, updates);
      toast.success('User updated successfully');
      fetchUsers();
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast.error('Cannot deactivate your own account');
      return;
    }

    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        await apiClient.delete(`/admin/users/${userId}`);
        toast.success('User deactivated successfully');
        fetchUsers();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to deactivate user');
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Redirect if not admin
  if (currentUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-sm"><strong>Debug Info:</strong></p>
              <p className="text-sm">Current User: {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Not logged in'}</p>
              <p className="text-sm">Email: {currentUser?.email || 'N/A'}</p>
              <p className="text-sm">Role: {currentUser?.role || 'N/A'}</p>
              <p className="text-sm mt-2">To access admin dashboard:</p>
              <p className="text-sm">1. Login with: admin@logicore.com / admin123</p>
              <p className="text-sm">2. Look for "Admin Panel" in sidebar</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-500" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              System administration and user management
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  In inventory
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">
                  Active suppliers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Management Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            {isUsersLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                            <div>
                              <div className="font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.is_active ? (
                              <>
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <span className="text-green-600">Active</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-4 h-4 text-red-500" />
                                <span className="text-red-600">Inactive</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{formatDate(user.last_login)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeactivateUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user role and account status
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedUser.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, is_active: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleUpdateUser(selectedUser.id, {
                      role: selectedUser.role,
                      is_active: selectedUser.is_active
                    })}
                  >
                    Update User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}