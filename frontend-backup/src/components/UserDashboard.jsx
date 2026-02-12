import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const UserDashboard = ({ apiBase, onTabChange }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myProducts: 0,
    myOrders: 0,
    myLowStockItems: 0,
    recentActivity: [],
    personalAlerts: [],
    todayStats: {
      ordersCreated: 0,
      productsAdded: 0,
      stockUpdates: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch only user-owned data
      const [productsRes, ordersRes, alertsRes] = await Promise.all([
        axios.get(`${apiBase}/products?user_only=true`), // Only user's products
        axios.get(`${apiBase}/orders?user_only=true`),   // Only user's orders
        axios.get(`${apiBase}/reports/alerts?user_only=true`) // Only user's alerts
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const alerts = alertsRes.data || [];

      // Calculate user-specific metrics
      const myLowStockItems = products.filter(p => p.stock_quantity <= p.reorder_level).length;
      
      // Today's activity (last 24 hours)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => 
        new Date(order.created_at) >= today
      );
      
      const todayProducts = products.filter(product => 
        new Date(product.created_at) >= today
      );

      // Recent activity (last 5 items)
      const recentActivity = [
        ...orders.slice(0, 3).map(order => ({
          type: 'order',
          title: `Order #${order.id}`,
          description: `${order.status} - ${order.total_amount ? `$${order.total_amount}` : 'Processing'}`,
          timestamp: order.created_at,
          status: order.status
        })),
        ...products.slice(0, 2).map(product => ({
          type: 'product',
          title: product.name,
          description: `Stock: ${product.stock_quantity}`,
          timestamp: product.updated_at || product.created_at,
          status: product.stock_quantity <= product.reorder_level ? 'low_stock' : 'normal'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

      setStats({
        myProducts: products.length,
        myOrders: orders.length,
        myLowStockItems,
        recentActivity,
        personalAlerts: alerts.slice(0, 5),
        todayStats: {
          ordersCreated: todayOrders.length,
          productsAdded: todayProducts.length,
          stockUpdates: 0 // Would need activity tracking for this
        }
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: colors.textSecondary }}>
        Loading your dashboard...
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
          Welcome back, {user?.firstName}!
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          margin: 0,
          fontSize: '0.875rem' 
        }}>
          Here's your personal inventory overview
        </p>
      </div>

      {/* Personal Stats Grid */}
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
            {stats.myProducts}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            My Products
          </div>
        </div>

        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: colors.accent }}>
            {stats.myOrders}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            My Orders
          </div>
        </div>

        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ef4444' }}>
            {stats.myLowStockItems}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
            Low Stock Items
          </div>
        </div>
      </div>

      {/* Today's Activity */}
      <div style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          margin: '0 0 20px 0',
          color: colors.textPrimary 
        }}>
          Today's Activity
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            padding: '16px',
            background: colors.bgApp,
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.accent }}>
              {stats.todayStats.ordersCreated}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
              Orders Created
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: colors.bgApp,
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.accent }}>
              {stats.todayStats.productsAdded}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
              Products Added
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: colors.bgApp,
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.accent }}>
              {stats.todayStats.stockUpdates}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
              Stock Updates
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Activity */}
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
            Recent Activity
          </h2>

          {stats.recentActivity.length === 0 ? (
            <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
              No recent activity
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentActivity.map((activity, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: colors.bgApp,
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderSubtle}`
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 500,
                      color: colors.textPrimary 
                    }}>
                      {activity.title}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: activity.status === 'completed' ? '#dcfce7' : 
                                 activity.status === 'low_stock' ? '#fef2f2' : '#fef3c7',
                      color: activity.status === 'completed' ? '#166534' : 
                             activity.status === 'low_stock' ? '#dc2626' : '#92400e'
                    }}>
                      {activity.type}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: colors.textSecondary,
                    marginBottom: '4px'
                  }}>
                    {activity.description}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: colors.textSecondary 
                  }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal Alerts */}
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
            Your Alerts
          </h2>

          {stats.personalAlerts.length === 0 ? (
            <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
              No alerts for you
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.personalAlerts.map((alert, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: colors.bgApp,
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderSubtle}`,
                  borderLeft: `4px solid #ef4444`
                }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 500,
                    color: colors.textPrimary,
                    marginBottom: '4px'
                  }}>
                    {alert.product_name}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444' 
                  }}>
                    Low stock: {alert.stock_quantity} remaining (reorder at {alert.reorder_level})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '8px',
        padding: '24px',
        marginTop: '24px'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          margin: '0 0 20px 0',
          color: colors.textPrimary 
        }}>
          Quick Actions
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <button 
            onClick={() => onTabChange && onTabChange('products')}
            style={{
              padding: '12px 16px',
              background: colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Add New Product
          </button>
          
          <button 
            onClick={() => onTabChange && onTabChange('orders')}
            style={{
              padding: '12px 16px',
              background: colors.bgApp,
              color: colors.textPrimary,
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Create Order
          </button>
          
          <button 
            onClick={() => onTabChange && onTabChange('ai-reports')}
            style={{
              padding: '12px 16px',
              background: colors.bgApp,
              color: colors.textPrimary,
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            View My Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;