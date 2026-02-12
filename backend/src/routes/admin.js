import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and admin role requirement to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    const [usersResult, productsResult, suppliersResult, ordersResult, lowStockResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM suppliers'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query('SELECT COUNT(*) FROM products WHERE stock_quantity <= reorder_level')
    ]);

    const stats = {
      totalUsers: parseInt(usersResult.rows[0].count),
      totalProducts: parseInt(productsResult.rows[0].count),
      totalSuppliers: parseInt(suppliersResult.rows[0].count),
      totalOrders: parseInt(ordersResult.rows[0].count),
      lowStockItems: parseInt(lowStockResult.rows[0].count)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, role, is_active, created_at, last_login
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user
router.patch('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, is_active } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, is_active
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (soft delete by deactivating)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting the current admin user
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(`
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING id, email, first_name, last_name
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deactivated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system activity logs (if you want to add this later)
router.get('/activity', async (req, res) => {
  try {
    // This would require an activity log table
    // For now, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;