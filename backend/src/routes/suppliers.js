// backend/src/routes/suppliers.js
import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/suppliers - list all suppliers
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    let query = `SELECT id, name, contact_email, phone, created_at 
                 FROM suppliers`;
    let params = [];
    
    // If user is authenticated and requests user_only data, filter by user_id
    if (req.user && req.query.user_only === 'true') {
      query += ` WHERE user_id = $1`;
      params.push(req.user.userId);
    }
    // If user is not admin, only show their own data
    else if (req.user && req.user.role !== 'admin') {
      query += ` WHERE user_id = $1`;
      params.push(req.user.userId);
    }
    
    query += ` ORDER BY name ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    next(err);
  }
});

// GET /api/suppliers/:id - get single supplier
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    const result = await pool.query(`
      SELECT id, name, contact_email, phone, created_at 
      FROM suppliers 
      WHERE id = $1
    `, [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching supplier:', err);
    next(err);
  }
});

// POST /api/suppliers - create new supplier
router.post('/', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, contact_email, phone } = req.body;
    const userId = req.user.userId;

    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    if (contact_email && typeof contact_email !== 'string') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Contact email must be a string' });
    }

    if (phone && typeof phone !== 'string') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Phone must be a string' });
    }

    const trimmedName = name.trim();

    // Check for duplicate name (within user's suppliers)
    const existingSupplier = await client.query(`
      SELECT id FROM suppliers 
      WHERE LOWER(TRIM(name)) = LOWER($1) AND user_id = $2
    `, [trimmedName, userId]);

    if (existingSupplier.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'A supplier with this name already exists' });
    }

    // Create supplier with user_id
    const result = await client.query(`
      INSERT INTO suppliers (name, contact_email, phone, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, contact_email, phone, created_at
    `, [
      trimmedName,
      contact_email ? contact_email.trim() : null,
      phone ? phone.trim() : null,
      userId
    ]);

    const newSupplier = result.rows[0];
    
    await client.query('COMMIT');
    
    console.log('✅ Created supplier:', newSupplier.name);
    
    res.status(201).json(newSupplier);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating supplier:', err);
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/suppliers/:id - update supplier
router.put('/:id', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, contact_email, phone } = req.body;
    const userId = req.user.userId;

    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);

    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    if (contact_email && typeof contact_email !== 'string') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Contact email must be a string' });
    }

    if (phone && typeof phone !== 'string') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Phone must be a string' });
    }

    const supplierId = parseInt(id);
    const trimmedName = name.trim();

    // Check if supplier exists and user has access
    let supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
    let supplierParams = [supplierId];
    
    // If user is not admin, ensure they can only edit their own suppliers
    if (req.user.role !== 'admin') {
      supplierQuery += ' AND user_id = $2';
      supplierParams.push(userId);
    }

    const existingSupplier = await client.query(supplierQuery, supplierParams);

    if (existingSupplier.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Supplier not found or access denied' });
    }

    // Check for duplicate name (excluding current supplier, within user's suppliers)
    const duplicateCheck = await client.query(`
      SELECT id FROM suppliers 
      WHERE LOWER(TRIM(name)) = LOWER($1) AND id != $2 AND user_id = $3
    `, [trimmedName, supplierId, userId]);

    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'A supplier with this name already exists' });
    }

    // Update supplier
    const result = await client.query(`
      UPDATE suppliers 
      SET name = $1, contact_email = $2, phone = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, contact_email, phone, created_at
    `, [
      trimmedName,
      contact_email ? contact_email.trim() : null,
      phone ? phone.trim() : null,
      supplierId,
      userId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Supplier not found or access denied' });
    }

    const updatedSupplier = result.rows[0];
    
    await client.query('COMMIT');
    
    console.log('✅ Updated supplier:', updatedSupplier.name);
    
    res.json(updatedSupplier);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating supplier:', err);
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/suppliers/:id - delete supplier
router.delete('/:id', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`🗑️  Delete supplier request: ID=${id}, User=${userId}, Role=${userRole}`);

    // Set the user context for audit logging
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);

    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    const supplierId = parseInt(id);

    // Check if supplier exists and user has access
    let supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
    let supplierParams = [supplierId];
    
    // If user is not admin, ensure they can only delete their own suppliers
    if (req.user.role !== 'admin') {
      supplierQuery += ' AND user_id = $2';
      supplierParams.push(userId);
    }

    const existingSupplier = await client.query(supplierQuery, supplierParams);

    if (existingSupplier.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Supplier not found or access denied' });
    }

    const supplierName = existingSupplier.rows[0].name;

    // Check if supplier has associated products
    // For admin: check ALL products, for regular user: check only their products
    let productsCheckQuery = 'SELECT COUNT(*) as count FROM products WHERE supplier_id = $1';
    let productsCheckParams = [supplierId];
    
    if (req.user.role !== 'admin') {
      productsCheckQuery += ' AND user_id = $2';
      productsCheckParams.push(userId);
    }
    
    const productsCheck = await client.query(productsCheckQuery, productsCheckParams);
    const productCount = parseInt(productsCheck.rows[0].count);

    if (productCount > 0) {
      await client.query('ROLLBACK');
      console.log(`❌ Cannot delete supplier ${supplierName}: ${productCount} products associated`);
      return res.status(400).json({ 
        error: `Cannot delete supplier "${supplierName}". ${productCount} product(s) are associated with this supplier. Please reassign or delete those products first.` 
      });
    }

    console.log(`✅ No products associated, proceeding with deletion`);

    // Delete the supplier
    let deleteQuery = 'DELETE FROM suppliers WHERE id = $1';
    let deleteParams = [supplierId];
    
    if (req.user.role !== 'admin') {
      deleteQuery += ' AND user_id = $2';
      deleteParams.push(userId);
    }
    
    await client.query(deleteQuery, deleteParams);

    await client.query('COMMIT');

    console.log('✅ Deleted supplier:', supplierName);
    
    res.json({ 
      success: true, 
      message: `Supplier "${supplierName}" has been deleted successfully` 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting supplier:', err);
    next(err);
  } finally {
    client.release();
  }
});

export default router;
