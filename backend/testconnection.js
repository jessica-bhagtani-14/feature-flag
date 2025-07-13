// test-db-connection.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'feature_flags',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('Connection details:', {
    user: pool.options.user,
    host: pool.options.host,
    database: pool.options.database,
    port: pool.options.port
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');

    // Test database version
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', versionResult.rows[0].version);

    // Test database name
    const dbResult = await client.query('SELECT current_database()');
    console.log('🗄️  Current database:', dbResult.rows[0].current_database);

    // Test creating a simple table
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_message VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Test table created successfully');

    // Insert test data
    const insertResult = await client.query(
      'INSERT INTO connection_test (test_message) VALUES ($1) RETURNING *',
      ['Connection test successful']
    );
    console.log('✅ Test data inserted:', insertResult.rows[0]);

    // Query test data
    const selectResult = await client.query('SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1');
    console.log('✅ Test data retrieved:', selectResult.rows[0]);

    // Clean up test table
    await client.query('DROP TABLE connection_test');
    console.log('✅ Test table cleaned up');

    client.release();
    console.log('🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    
    // Common troubleshooting hints
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure Docker containers are running: docker-compose ps');
    console.log('2. Check PostgreSQL logs: docker-compose logs postgres');
    console.log('3. Verify port 5432 is accessible: netstat -an | grep 5432');
    console.log('4. Check your .env file configuration');
    console.log('5. Try connecting directly: docker-compose exec postgres psql -U user -d feature_flags');
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection();