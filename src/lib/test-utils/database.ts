import mongoose from 'mongoose';
import { Board, Column, Card } from '@/lib/db/models';

const MONGODB_URI = process.env.MONGODB_URI || '';
const TEST_DB_PREFIX = 'kanban_test_';

// Generate a unique test database name for each test run
export const getTestDatabaseName = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${TEST_DB_PREFIX}${timestamp}_${random}`;
};

// Connect to test database
export const connectToTestDatabase = async (dbName?: string) => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  const testDbName = dbName || getTestDatabaseName();
  const testUri = MONGODB_URI.replace(/\/[^/]*\?/, `/${testDbName}?`);
  
  await mongoose.connect(testUri);
  return testDbName;
};

// Clean up test database
export const cleanupTestDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const dbName = mongoose.connection.db?.databaseName;
    
    if (dbName?.startsWith(TEST_DB_PREFIX)) {
      // Clear all collections
      await Promise.all([
        Board.deleteMany({}),
        Column.deleteMany({}),
        Card.deleteMany({})
      ]);
    }
  }
};

// Drop test database completely
export const dropTestDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const dbName = mongoose.connection.db?.databaseName;
    
    if (dbName?.startsWith(TEST_DB_PREFIX) && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    
    await mongoose.disconnect();
  }
};

// Create test data
export const createTestBoard = async (title: string = 'Test Board') => {
  const board = await Board.create({
    id: `test-board-${Date.now()}`,
    title
  });
  
  return board;
};

export const createTestColumn = async (boardId: string, title: string = 'Test Column', order: number = 0) => {
  const column = await Column.create({
    id: `test-column-${Date.now()}`,
    title,
    boardId,
    order
  });
  
  return column;
};

export const createTestCard = async (columnId: string, title: string = 'Test Card', order: number = 0) => {
  const card = await Card.create({
    id: `test-card-${Date.now()}`,
    title,
    columnId,
    order
  });
  
  return card;
};

// Verify database connection
export const verifyDatabaseConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Test with a simple operation
    await Board.countDocuments({}).limit(1);
    return true;
  } catch (error) {
    console.error('Database connection verification failed:', error);
    return false;
  }
};

// Get database stats
export const getDatabaseStats = async () => {
  const stats = {
    boards: await Board.countDocuments({}),
    columns: await Column.countDocuments({}),
    cards: await Card.countDocuments({}),
    activeBoards: await Board.countDocuments({}),
    archivedColumns: await Column.countDocuments({ status: 'archived' }),
    archivedCards: await Card.countDocuments({ status: 'archived' })
  };
  
  return stats;
};