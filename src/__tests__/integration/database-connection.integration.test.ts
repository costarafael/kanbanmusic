import { 
  connectToTestDatabase, 
  verifyDatabaseConnection, 
  cleanupTestDatabase,
  dropTestDatabase,
  getDatabaseStats 
} from '@/lib/test-utils/database';
import mongoose from 'mongoose';

describe('Database Connection Integration Tests', () => {
  beforeAll(async () => {
    await connectToTestDatabase();
  });

  afterAll(async () => {
    await dropTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Database Connection', () => {
    it('should successfully connect to MongoDB Atlas', async () => {
      const isConnected = await verifyDatabaseConnection();
      expect(isConnected).toBe(true);
    });

    it('should have correct database name', () => {
      const dbName = mongoose.connection.db?.databaseName;
      expect(dbName).toMatch(/^kanban_test_/);
    });

    it('should be able to read database stats', async () => {
      const stats = await getDatabaseStats();
      
      expect(stats).toHaveProperty('boards');
      expect(stats).toHaveProperty('columns');
      expect(stats).toHaveProperty('cards');
      expect(stats).toHaveProperty('activeBoards');
      expect(stats).toHaveProperty('archivedColumns');
      expect(stats).toHaveProperty('archivedCards');
      
      // Initially should be empty
      expect(stats.boards).toBe(0);
      expect(stats.columns).toBe(0);
      expect(stats.cards).toBe(0);
    });

    it('should handle connection errors gracefully', async () => {
      // Disconnect temporarily
      await mongoose.disconnect();
      
      const isConnected = await verifyDatabaseConnection();
      expect(isConnected).toBe(false);
      
      // Reconnect for cleanup
      await connectToTestDatabase();
    });
  });

  describe('Database Operations', () => {
    it('should perform CRUD operations successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Board } = require('@/lib/db/models');
      
      // Create
      const board = await Board.create({
        id: 'test-crud-board',
        title: 'CRUD Test Board'
      });
      
      expect(board).toHaveProperty('id', 'test-crud-board');
      expect(board).toHaveProperty('title', 'CRUD Test Board');
      
      // Read
      const foundBoard = await Board.findOne({ id: 'test-crud-board' });
      expect(foundBoard).toBeTruthy();
      expect(foundBoard.title).toBe('CRUD Test Board');
      
      // Update
      const updatedBoard = await Board.findOneAndUpdate(
        { id: 'test-crud-board' },
        { title: 'Updated Board' },
        { new: true }
      );
      expect(updatedBoard.title).toBe('Updated Board');
      
      // Delete
      await Board.findOneAndDelete({ id: 'test-crud-board' });
      const deletedBoard = await Board.findOne({ id: 'test-crud-board' });
      expect(deletedBoard).toBeNull();
    });

    it('should handle concurrent operations', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Board } = require('@/lib/db/models');
      
      // Create multiple boards concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        Board.create({
          id: `concurrent-board-${i}`,
          title: `Concurrent Board ${i}`
        })
      );
      
      const boards = await Promise.all(promises);
      expect(boards).toHaveLength(5);
      
      // Verify all were created
      const count = await Board.countDocuments({
        id: { $regex: /^concurrent-board-/ }
      });
      expect(count).toBe(5);
    });
  });

  describe('Database Indexes and Performance', () => {
    it('should have proper indexes for queries', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Board, Column, Card } = require('@/lib/db/models');
      
      // Test index usage by checking query performance
      const startTime = Date.now();
      
      // Create test data
      const board = await Board.create({
        id: 'perf-test-board',
        title: 'Performance Test Board'
      });
      
      const columns = await Promise.all([
        Column.create({
          id: 'perf-column-1',
          title: 'Column 1',
          boardId: board.id,
          order: 0
        }),
        Column.create({
          id: 'perf-column-2',
          title: 'Column 2',
          boardId: board.id,
          order: 1
        })
      ]);
      
      // Create multiple cards
      const cardPromises = [];
      for (let i = 0; i < 10; i++) {
        cardPromises.push(
          Card.create({
            id: `perf-card-${i}`,
            title: `Card ${i}`,
            columnId: columns[i % 2].id,
            order: i
          })
        );
      }
      await Promise.all(cardPromises);
      
      // Test query performance
      const queryStartTime = Date.now();
      
      const result = await Board.aggregate([
        { $match: { id: board.id } },
        {
          $lookup: {
            from: 'columns',
            localField: 'id',
            foreignField: 'boardId',
            as: 'columns'
          }
        },
        {
          $lookup: {
            from: 'cards',
            localField: 'columns.id',
            foreignField: 'columnId',
            as: 'cards'
          }
        }
      ]);
      
      const queryTime = Date.now() - queryStartTime;
      const totalTime = Date.now() - startTime;
      
      expect(result).toHaveLength(1);
      expect(result[0].columns).toHaveLength(2);
      
      // Performance should be reasonable (less than 1 second for small dataset)
      expect(queryTime).toBeLessThan(1000);
      expect(totalTime).toBeLessThan(5000);
    });
  });
});