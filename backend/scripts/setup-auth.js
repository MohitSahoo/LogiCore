import { pool } from '../src/db.js';
import bcrypt from 'bcryptjs';

async function setupAuthTables() {
  try {
    console.log('🔄 Setting up authentication tables...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
      )
    `);

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at)`);

    // Create a proper admin user with hashed password
    const adminPassword = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Insert admin user
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = $2
    `, ['admin@logicore.com', passwordHash, 'Admin', 'User', 'admin']);

    console.log('✅ Authentication tables created successfully');
    console.log('✅ Default admin user created:');
    console.log('   Email: admin@logicore.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    // Test the setup
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Total users in database: ${userCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error setting up authentication tables:', error);
    throw error;
  }
}

// Run the setup
setupAuthTables()
  .then(() => {
    console.log('🎉 Authentication setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });