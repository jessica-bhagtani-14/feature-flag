require('dotenv').config();
const db = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create sample application
    const apiKey = uuidv4();
    const appResult = await db.query(
      'INSERT INTO applications (name, api_key, description) VALUES ($1, $2, $3) RETURNING id',
      ['Demo App', apiKey, 'Sample application for testing']
    );
    const appId = appResult.rows[0].id;
    console.log(`✓ Created demo application with API key: ${apiKey}`);

    // Create sample flags
    const sampleFlags = [
      {
        key: 'new_ui_enabled',
        name: 'New UI Design',
        description: 'Enable the new user interface design',
        enabled: false
      },
      {
        key: 'premium_features',
        name: 'Premium Features',
        description: 'Enable premium features for paid users',
        enabled: true
      },
      {
        key: 'dark_mode',
        name: 'Dark Mode',
        description: 'Enable dark mode theme',
        enabled: true
      }
    ];

    for (const flag of sampleFlags) {
      await db.query(
        'INSERT INTO flags (app_id, key, name, description, enabled) VALUES ($1, $2, $3, $4, $5)',
        [appId, flag.key, flag.name, flag.description, flag.enabled]
      );
      console.log(`✓ Created flag: ${flag.key}`);
    }

    console.log('Database seeding completed successfully!');
    console.log(`\nDemo API Key: ${apiKey}`);
    console.log('You can use this API key to test the evaluation endpoints.');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedDatabase();