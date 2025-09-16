// Test script to debug database issues
import { DatabaseService } from './src/services/database.js';

async function testDatabase() {
  console.log('Starting database test...');

  const db = new DatabaseService();

  try {
    // Wait a bit for connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test the database setup
    await db.testDatabaseSetup();
    console.log('✅ Database test completed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();