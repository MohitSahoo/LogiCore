import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured');
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser.rows.length > 0) {
      console.log('👤 User already exists:', existingUser.rows[0]);
      
      // Update to admin role if not already
      if (existingUser.rows[0].role !== 'admin') {
        await pool.query(
          'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
          ['admin', adminEmail]
        );
        console.log('✅ Updated user role to admin');
      } else {
        console.log('✅ User is already an admin');
      }
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, first_name, last_name, role`,
      [adminEmail, passwordHash, 'Admin', 'User', 'admin', true]
    );

    console.log('✅ Admin user created successfully:');
    console.log('📧 Email:', result.rows[0].email);
    console.log('👤 Name:', result.rows[0].first_name, result.rows[0].last_name);
    console.log('🔑 Role:', result.rows[0].role);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

// Also list all current users
async function listUsers() {
  try {
    console.log('\n📋 Current users in database:');
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at'
    );

    if (result.rows.length === 0) {
      console.log('No users found');
      return;
    }

    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🔑 Role: ${user.role}`);
      console.log(`   ✅ Active: ${user.is_active}`);
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

async function main() {
  await listUsers();
  await createAdminUser();
}

main().catch(console.error);