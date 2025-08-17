import { connectToTestDatabase, cleanupTestDatabase, verifyDatabaseConnection } from './database';

// Global setup for integration tests
export const setupIntegrationTests = async () => {
  console.log('🔧 Setting up integration tests...');
  
  try {
    // Connect to test database
    const dbName = await connectToTestDatabase();
    console.log(`📊 Connected to test database: ${dbName}`);
    
    // Verify connection
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to verify database connection');
    }
    
    console.log('✅ Integration test setup completed');
    return dbName;
  } catch (error) {
    console.error('❌ Integration test setup failed:', error);
    throw error;
  }
};

// Global teardown for integration tests
export const teardownIntegrationTests = async () => {
  console.log('🧹 Tearing down integration tests...');
  
  try {
    await cleanupTestDatabase();
    console.log('✅ Integration test teardown completed');
  } catch (error) {
    console.error('❌ Integration test teardown failed:', error);
    throw error;
  }
};

// Test helper to ensure clean state before each test
export const ensureCleanTestState = async () => {
  await cleanupTestDatabase();
};