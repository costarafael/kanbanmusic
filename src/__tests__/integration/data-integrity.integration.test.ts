import { 
  connectToTestDatabase, 
  cleanupTestDatabase,
  dropTestDatabase,
  createTestBoard,
  createTestColumn,
  createTestCard,
  getDatabaseStats
} from '@/lib/test-utils/database';
import { Board, Column, Card } from '@/lib/db/models';

describe('Data Integrity Integration Tests', () => {
  beforeAll(async () => {
    await connectToTestDatabase();
  });

  afterAll(async () => {
    await dropTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Data Validation', () => {
    it('should enforce required fields', async () => {
      // Test Board validation
      await expect(Board.create({})).rejects.toThrow();
      await expect(Board.create({ title: 'Valid Board' })).rejects.toThrow(); // Missing id
      
      // Valid board
      const board = await Board.create({
        id: 'valid-board',
        title: 'Valid Board'
      });
      expect(board).toBeTruthy();
      
      // Test Column validation
      await expect(Column.create({})).rejects.toThrow();
      await expect(Column.create({ 
        title: 'Valid Column',
        boardId: board.id 
      })).rejects.toThrow(); // Missing id and order
      
      // Valid column
      const column = await Column.create({
        id: 'valid-column',
        title: 'Valid Column',
        boardId: board.id,
        order: 0
      });
      expect(column).toBeTruthy();
      
      // Test Card validation
      await expect(Card.create({})).rejects.toThrow();
      await expect(Card.create({ 
        title: 'Valid Card',
        columnId: column.id 
      })).rejects.toThrow(); // Missing id and order
      
      // Valid card
      const card = await Card.create({
        id: 'valid-card',
        title: 'Valid Card',
        columnId: column.id,
        order: 0
      });
      expect(card).toBeTruthy();
    });

    it('should enforce unique IDs', async () => {
      const boardData = {
        id: 'duplicate-id',
        title: 'First Board'
      };
      
      // Create first board
      await Board.create(boardData);
      
      // Try to create second board with same ID
      await expect(Board.create({
        ...boardData,
        title: 'Second Board'
      })).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      const board = await createTestBoard();
      
      // Valid status
      const column = await Column.create({
        id: 'test-column',
        title: 'Test Column',
        boardId: board.id,
        order: 0,
        status: 'active'
      });
      expect(column.status).toBe('active');
      
      // Invalid status should be rejected
      await expect(Column.create({
        id: 'test-column-invalid',
        title: 'Test Column',
        boardId: board.id,
        order: 1,
        status: 'invalid-status' as any
      })).rejects.toThrow();
    });
  });

  describe('Referential Integrity', () => {
    it('should handle orphaned data correctly', async () => {
      const board = await createTestBoard('Orphan Test Board');
      const column = await createTestColumn(board.id, 'Orphan Test Column');
      const card = await createTestCard(column.id, 'Orphan Test Card');
      
      // Delete board (should cascade)
      await Board.deleteOne({ id: board.id });
      
      // Column and card should still exist (we don't have automatic cascade)
      const remainingColumn = await Column.findOne({ id: column.id });
      const remainingCard = await Card.findOne({ id: card.id });
      
      expect(remainingColumn).toBeTruthy();
      expect(remainingCard).toBeTruthy();
      
      // But they're orphaned
      const orphanedColumns = await Column.find({ 
        boardId: board.id 
      });
      const orphanedCards = await Card.find({ 
        columnId: column.id 
      });
      
      expect(orphanedColumns).toHaveLength(1);
      expect(orphanedCards).toHaveLength(1);
      
      // Clean up orphaned data
      await Column.deleteMany({ boardId: board.id });
      await Card.deleteMany({ columnId: column.id });
      
      const finalStats = await getDatabaseStats();
      expect(finalStats.boards).toBe(0);
      expect(finalStats.columns).toBe(0);
      expect(finalStats.cards).toBe(0);
    });

    it('should maintain consistency with archiving', async () => {
      const board = await createTestBoard('Archive Test Board');
      const column = await createTestColumn(board.id, 'Archive Test Column');
      const cards = [];
      
      // Create multiple cards
      for (let i = 0; i < 3; i++) {
        const card = await createTestCard(column.id, `Card ${i}`);
        cards.push(card);
      }
      
      // Archive column (should archive all its cards)
      await Column.findOneAndUpdate(
        { id: column.id },
        { status: 'archived' }
      );
      
      // Manually archive cards (since we don't have triggers)
      await Card.updateMany(
        { columnId: column.id, status: 'active' },
        { status: 'archived' }
      );
      
      // Verify archiving
      const archivedColumn = await Column.findOne({ id: column.id });
      const archivedCards = await Card.find({ columnId: column.id });
      
      expect(archivedColumn?.status).toBe('archived');
      archivedCards.forEach(card => {
        expect(card.status).toBe('archived');
      });
      
      // Check active counts
      const activeColumns = await Column.countDocuments({ 
        boardId: board.id, 
        status: 'active' 
      });
      const activeCards = await Card.countDocuments({ 
        columnId: column.id, 
        status: 'active' 
      });
      
      expect(activeColumns).toBe(0);
      expect(activeCards).toBe(0);
    });
  });

  describe('Data Consistency Under Load', () => {
    it('should handle concurrent card creation', async () => {
      const board = await createTestBoard('Concurrent Test Board');
      const column = await createTestColumn(board.id, 'Concurrent Test Column');
      
      // Create multiple cards concurrently
      const concurrentPromises = Array.from({ length: 10 }, (_, i) =>
        Card.create({
          id: `concurrent-card-${i}`,
          title: `Concurrent Card ${i}`,
          columnId: column.id,
          order: i
        })
      );
      
      const cards = await Promise.all(concurrentPromises);
      expect(cards).toHaveLength(10);
      
      // Verify all cards were created
      const savedCards = await Card.find({ columnId: column.id }).sort({ order: 1 });
      expect(savedCards).toHaveLength(10);
      
      // Verify order integrity
      savedCards.forEach((card, index) => {
        expect(card.order).toBe(index);
      });
    });

    it('should handle concurrent updates without data corruption', async () => {
      const board = await createTestBoard('Update Test Board');
      const column = await createTestColumn(board.id, 'Update Test Column');
      const card = await createTestCard(column.id, 'Update Test Card');
      
      // Update the same card concurrently with different titles
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        Card.findOneAndUpdate(
          { id: card.id },
          { title: `Updated Title ${i}` },
          { new: true }
        )
      );
      
      const results = await Promise.all(updatePromises);
      
      // All updates should succeed
      results.forEach(result => {
        expect(result).toBeTruthy();
        expect(result?.title).toMatch(/^Updated Title \d$/);
      });
      
      // Final state should be consistent
      const finalCard = await Card.findOne({ id: card.id });
      expect(finalCard?.title).toMatch(/^Updated Title \d$/);
    });
  });

  describe('Database Constraints and Indexes', () => {
    it('should efficiently query boards with their data', async () => {
      // Create test data
      const board = await createTestBoard('Performance Test Board');
      const columns = [];
      
      for (let i = 0; i < 3; i++) {
        const column = await createTestColumn(board.id, `Column ${i}`, i);
        columns.push(column);
        
        // Add cards to each column
        for (let j = 0; j < 5; j++) {
          await createTestCard(column.id, `Card ${i}-${j}`, j);
        }
      }
      
      // Time the query
      const startTime = Date.now();
      
      const result = await Board.aggregate([
        { $match: { id: board.id } },
        {
          $lookup: {
            from: 'columns',
            localField: 'id',
            foreignField: 'boardId',
            as: 'columns',
            pipeline: [
              { $match: { status: 'active' } },
              { $sort: { order: 1 } }
            ]
          }
        },
        {
          $lookup: {
            from: 'cards',
            localField: 'columns.id',
            foreignField: 'columnId',
            as: 'cards',
            pipeline: [
              { $match: { status: 'active' } },
              { $sort: { order: 1 } }
            ]
          }
        }
      ]);
      
      const queryTime = Date.now() - startTime;
      
      // Verify results
      expect(result).toHaveLength(1);
      expect(result[0].columns).toHaveLength(3);
      
      // Query should be fast (less than 100ms for small dataset)
      expect(queryTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', async () => {
      const board = await createTestBoard('Large Dataset Test');
      
      // Create a column
      const column = await createTestColumn(board.id, 'Large Column');
      
      // Create many cards (simulate pagination needs)
      const cardPromises = [];
      for (let i = 0; i < 100; i++) {
        cardPromises.push(
          Card.create({
            id: `large-card-${i}`,
            title: `Large Card ${i}`,
            columnId: column.id,
            order: i
          })
        );
      }
      
      await Promise.all(cardPromises);
      
      // Test pagination query performance
      const startTime = Date.now();
      
      const paginatedCards = await Card.find({ 
        columnId: column.id,
        status: 'active' 
      })
      .sort({ order: 1 })
      .limit(20)
      .skip(40);
      
      const queryTime = Date.now() - startTime;
      
      expect(paginatedCards).toHaveLength(20);
      expect(paginatedCards[0].order).toBe(40);
      expect(paginatedCards[19].order).toBe(59);
      
      // Pagination should be efficient
      expect(queryTime).toBeLessThan(50);
    });
  });
});