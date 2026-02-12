import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Fetch fresh user data from database to get current role
    try {
      const result = await pool.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [user.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      // Update user object with fresh role from database
      req.user = {
        ...user,
        role: result.rows[0].role,
        email: result.rows[0].email
      };
      
      console.log(`🔐 Auth: User ${req.user.email} (ID: ${req.user.userId}) - Role: ${req.user.role}`);
      
      next();
    } catch (dbErr) {
      console.error('Error fetching user role:', dbErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (!err) {
        // Fetch fresh user data from database to get current role
        try {
          const result = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [user.userId]
          );
          
          if (result.rows.length > 0) {
            req.user = {
              ...user,
              role: result.rows[0].role,
              email: result.rows[0].email
            };
            console.log(`🔓 OptionalAuth: User ${req.user.email} (ID: ${req.user.userId}) - Role: ${req.user.role}`);
          }
        } catch (dbErr) {
          console.error('Error fetching user role:', dbErr);
        }
      }
      next();
    });
  } else {
    next();
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');