import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['mohitsahoo05@gmail.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('👤 User already exists:', existingUser.rows[0]);
      
      // Update to admin role if not already
      if (existingUser.rows[0].role !== 'admin') {
        await pool.query(
          'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
          ['admin', 'mohitsahoo05@gmail.com']
        );
        console.log('✅ Updated user role to admin');
      } else {
        console.log('✅ User is already an admin');
      }
      return;
    }

    // Hash password
    const password = 'admin123'; // Default password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, first_name, last_name, role`,
      ['mohitsahoo05@gmail.com', passwordHash, 'Mohit', 'Sahoo', 'admin', true]
    );

    console.log('✅ Admin user created successfully:');
    console.log('📧 Email:', result.rows[0].email);
    console.log('👤 Name:', result.rows[0].first_name, result.rows[0].last_name);
    console.log('🔑 Role:', result.rows[0].role);
    console.log('🔒 Password: admin123 (please change after first login)');

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