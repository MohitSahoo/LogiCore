import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';

const AdminDashboard = ({ apiBase }) => {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    totalOrders: 0,
    lowStockItems: 0,
    recentActivity: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin statistics
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${apiBase}/admin/stats`),
        axios.get(`${apiBase}/admin/users`)
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${apiBase}/admin/users/${userId}`, {
        is_active: !currentStatus
      });
      
      // Refresh users list
      const usersRes = await axios.get(`${apiBase}/admin/users`);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.patch(`${apiBase}/admin/users/${userId}`, {
        role: newRole
      });
      
      // Refresh users list
      const usersRes = await axios.get(`${apiBase}/admin/users`);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: colors.textSecondary }}>
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div style={{ color: colors.textPrimary }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 600, 
          margin: 0, 
          marginBottom: '8px',
          color: colors.textPrimary 
        }}>
          Admin Dashboard
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          margin: 0,
          fontSize: '0.875rem' 
        }}>
          System overview and user management
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: colors.accent }}>
            {stats.totalUsers}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            Total Users
          </div>
        </div>

        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: colors.accent }}>
            {stats.totalProducts}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            Total Products
          </div>
        </div>

        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: colors.accent }}>
            {stats.totalSuppliers}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            Total Suppliers
          </div>
        </div>

        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: colors.accent }}>
            {stats.totalOrders}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            Total Orders
          </div>
        </div>

        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ef4444' }}>
            {stats.lowStockItems}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            Low Stock Items
          </div>
        </div>
      </div>

      {/* User Management */}
      <div style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          margin: '0 0 20px 0',
          color: colors.textPrimary 
        }}>
          User Management
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 8px', 
                  color: colors.textSecondary,
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  User
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 8px', 
                  color: colors.textSecondary,
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Role
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 8px', 
                  color: colors.textSecondary,
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Status
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 8px', 
                  color: colors.textSecondary,
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div>
                      <div style={{ 
                        color: colors.textPrimary, 
                        fontSize: '0.875rem',
                        fontWeight: 500 
                      }}>
                        {user.first_name} {user.last_name}
                      </div>
                      <div style={{ 
                        color: colors.textSecondary, 
                        fontSize: '0.75rem' 
                      }}>
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      style={{
                        background: colors.bgSurface,
                        border: `1px solid ${colors.borderSubtle}`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: colors.textPrimary,
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: user.is_active ? '#dcfce7' : '#fef2f2',
                      color: user.is_active ? '#166534' : '#dc2626'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      style={{
                        background: user.is_active ? '#ef4444' : '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;