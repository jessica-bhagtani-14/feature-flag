require('dotenv').config();
const db = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = [
      '001_create_applications.sql',
      '002_create_flags.sql', 
      '003_create_flag_rules.sql',
      '004_create_flag_evaluations.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await db.query(sql);
        console.log(`✓ Completed: ${file}`);
      } else {
        console.log(`⚠️  Migration file not found: ${file}`);
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();