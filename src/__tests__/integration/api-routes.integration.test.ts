import { 
  connectToTestDatabase, 
  cleanupTestDatabase,
  dropTestDatabase,
  createTestBoard,
  createTestColumn
} from '@/lib/test-utils/database';
import { NextRequest } from 'next/server';

// Import API route handlers
import { POST as createBoard } from '@/app/api/boards/route';
import { GET as getBoard, PATCH as updateBoard, DELETE as deleteBoard } from '@/app/api/boards/[id]/route';
import { POST as createColumn } from '@/app/api/boards/[id]/columns/route';
import { PATCH as updateColumn, DELETE as deleteColumn } from '@/app/api/columns/[id]/route';
import { POST as createCard } from '@/app/api/columns/[id]/cards/route';
import { PATCH as updateCard, DELETE as deleteCard } from '@/app/api/cards/[id]/route';

// Mock NextRequest helper
const mockRequest = (method: string, body?: any, url?: string) => {
  const request = {
    json: jest.fn().mockResolvedValue(body || {}),
    nextUrl: {
      pathname: url || '/api/test',
    },
    method,
  } as unknown as NextRequest;
  
  return request;
};

// Mock params helper
const mockParams = (id: string) => {
  return Promise.resolve({ id });
};

describe('API Routes Integration Tests', () => {
  beforeAll(async () => {
    await connectToTestDatabase();
  });

  afterAll(async () => {
    await dropTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Board API Routes', () => {
    it('should create, read, update, and delete a board', async () => {
      // CREATE Board
      const createRequest = mockRequest('POST', { title: 'Integration Test Board' });
      const createResponse = await createBoard(createRequest);
      const createData = await createResponse.json();
      
      expect(createResponse.status).toBe(200);
      expect(createData).toHaveProperty('id');
      expect(createData.title).toBe('Integration Test Board');
      
      const boardId = createData.id;
      
      // READ Board
      const getRequest = mockRequest('GET');
      const getResponse = await getBoard(getRequest, { params: mockParams(boardId) });
      const getData = await getResponse.json();
      
      expect(getResponse.status).toBe(200);
      expect(getData.board.id).toBe(boardId);
      expect(getData.board.title).toBe('Integration Test Board');
      expect(getData.columns).toEqual([]);
      expect(getData.cards).toEqual([]);
      
      // UPDATE Board
      const updateRequest = mockRequest('PATCH', { title: 'Updated Board Title' });
      const updateResponse = await updateBoard(updateRequest, { params: mockParams(boardId) });
      const updateData = await updateResponse.json();
      
      expect(updateResponse.status).toBe(200);
      expect(updateData.title).toBe('Updated Board Title');
      
      // DELETE Board
      const deleteRequest = mockRequest('DELETE');
      const deleteResponse = await deleteBoard(deleteRequest, { params: mockParams(boardId) });
      const deleteData = await deleteResponse.json();
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteData.message).toBe('Board deleted successfully');
      
      // Verify deletion
      const verifyRequest = mockRequest('GET');
      const verifyResponse = await getBoard(verifyRequest, { params: mockParams(boardId) });
      expect(verifyResponse.status).toBe(404);
    });

    it('should handle board not found scenarios', async () => {
      const request = mockRequest('GET');
      const response = await getBoard(request, { params: mockParams('non-existent-board') });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Board not found');
    });
  });

  describe('Column API Routes', () => {
    let boardId: string;

    beforeEach(async () => {
      const board = await createTestBoard('Test Board for Columns');
      boardId = board.id;
    });

    it('should create, update, and delete columns', async () => {
      // CREATE Column
      const createRequest = mockRequest('POST', { title: 'Integration Test Column' });
      const createResponse = await createColumn(createRequest, { params: mockParams(boardId) });
      const createData = await createResponse.json();
      
      expect(createResponse.status).toBe(200);
      expect(createData).toHaveProperty('id');
      expect(createData.title).toBe('Integration Test Column');
      expect(createData.boardId).toBe(boardId);
      expect(createData.order).toBe(0);
      
      const columnId = createData.id;
      
      // UPDATE Column
      const updateRequest = mockRequest('PATCH', { 
        title: 'Updated Column',
        order: 1
      });
      const updateResponse = await updateColumn(updateRequest, { params: mockParams(columnId) });
      const updateData = await updateResponse.json();
      
      expect(updateResponse.status).toBe(200);
      expect(updateData.title).toBe('Updated Column');
      expect(updateData.order).toBe(1);
      
      // Archive Column
      const archiveRequest = mockRequest('PATCH', { status: 'archived' });
      const archiveResponse = await updateColumn(archiveRequest, { params: mockParams(columnId) });
      const archiveData = await archiveResponse.json();
      
      expect(archiveResponse.status).toBe(200);
      expect(archiveData.status).toBe('archived');
      
      // DELETE Column (only works when archived)
      const deleteRequest = mockRequest('DELETE');
      const deleteResponse = await deleteColumn(deleteRequest, { params: mockParams(columnId) });
      const deleteData = await deleteResponse.json();
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteData.message).toBe('Column deleted successfully');
    });

    it('should maintain column order correctly', async () => {
      // Create multiple columns
      const columns = [];
      for (let i = 0; i < 3; i++) {
        const request = mockRequest('POST', { title: `Column ${i}` });
        const response = await createColumn(request, { params: mockParams(boardId) });
        const data = await response.json();
        columns.push(data);
      }
      
      // Verify order
      columns.forEach((column, index) => {
        expect(column.order).toBe(index);
      });
      
      // Get board and verify columns are in order
      const getBoardRequest = mockRequest('GET');
      const getBoardResponse = await getBoard(getBoardRequest, { params: mockParams(boardId) });
      const boardData = await getBoardResponse.json();
      
      expect(boardData.columns).toHaveLength(3);
      boardData.columns.forEach((column: any, index: number) => {
        expect(column.order).toBe(index);
      });
    });
  });

  describe('Card API Routes', () => {
    let boardId: string;
    let columnId: string;

    beforeEach(async () => {
      const board = await createTestBoard('Test Board for Cards');
      boardId = board.id;
      
      const column = await createTestColumn(boardId, 'Test Column for Cards');
      columnId = column.id;
    });

    it('should create, update, and delete cards', async () => {
      // CREATE Card
      const createRequest = mockRequest('POST', { title: 'Integration Test Card' });
      const createResponse = await createCard(createRequest, { params: mockParams(columnId) });
      const createData = await createResponse.json();
      
      expect(createResponse.status).toBe(200);
      expect(createData).toHaveProperty('id');
      expect(createData.title).toBe('Integration Test Card');
      expect(createData.columnId).toBe(columnId);
      expect(createData.order).toBe(0);
      
      const cardId = createData.id;
      
      // UPDATE Card with all fields
      const updateRequest = mockRequest('PATCH', {
        title: 'Updated Card',
        description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated description' }] }] },
        audioUrl: 'https://example.com/audio.mp3',
        order: 1
      });
      const updateResponse = await updateCard(updateRequest, { params: mockParams(cardId) });
      const updateData = await updateResponse.json();
      
      expect(updateResponse.status).toBe(200);
      expect(updateData.title).toBe('Updated Card');
      expect(updateData.description).toEqual(expect.any(Object));
      expect(updateData.audioUrl).toBe('https://example.com/audio.mp3');
      expect(updateData.order).toBe(1);
      
      // Archive Card
      const archiveRequest = mockRequest('PATCH', { status: 'archived' });
      const archiveResponse = await updateCard(archiveRequest, { params: mockParams(cardId) });
      const archiveData = await archiveResponse.json();
      
      expect(archiveResponse.status).toBe(200);
      expect(archiveData.status).toBe('archived');
      
      // DELETE Card (only works when archived)
      const deleteRequest = mockRequest('DELETE');
      const deleteResponse = await deleteCard(deleteRequest, { params: mockParams(cardId) });
      const deleteData = await deleteResponse.json();
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteData.message).toBe('Card deleted successfully');
    });

    it('should move cards between columns', async () => {
      // Create another column
      const secondColumn = await createTestColumn(boardId, 'Second Column', 1);
      
      // Create a card in the first column
      const createRequest = mockRequest('POST', { title: 'Movable Card' });
      const createResponse = await createCard(createRequest, { params: mockParams(columnId) });
      const createData = await createResponse.json();
      const cardId = createData.id;
      
      // Move card to second column
      const moveRequest = mockRequest('PATCH', { columnId: secondColumn.id });
      const moveResponse = await updateCard(moveRequest, { params: mockParams(cardId) });
      const moveData = await moveResponse.json();
      
      expect(moveResponse.status).toBe(200);
      expect(moveData.columnId).toBe(secondColumn.id);
      
      // Verify card is no longer in first column when getting board
      const getBoardRequest = mockRequest('GET');
      const getBoardResponse = await getBoard(getBoardRequest, { params: mockParams(boardId) });
      const boardData = await getBoardResponse.json();
      
      const firstColumnCards = boardData.cards.filter((card: any) => card.columnId === columnId);
      const secondColumnCards = boardData.cards.filter((card: any) => card.columnId === secondColumn.id);
      
      expect(firstColumnCards).toHaveLength(0);
      expect(secondColumnCards).toHaveLength(1);
      expect(secondColumnCards[0].id).toBe(cardId);
    });
  });

  describe('Full Workflow Integration', () => {
    it('should handle a complete kanban board workflow', async () => {
      // 1. Create a board
      const createBoardRequest = mockRequest('POST', { title: 'Full Workflow Board' });
      const createBoardResponse = await createBoard(createBoardRequest);
      const boardData = await createBoardResponse.json();
      const boardId = boardData.id;
      
      // 2. Create columns
      const columns = [];
      for (const title of ['To Do', 'In Progress', 'Done']) {
        const request = mockRequest('POST', { title });
        const response = await createColumn(request, { params: mockParams(boardId) });
        const data = await response.json();
        columns.push(data);
      }
      
      // 3. Create cards in different columns
      const cards = [];
      for (let i = 0; i < 5; i++) {
        const columnIndex = i % 3;
        const request = mockRequest('POST', { title: `Task ${i + 1}` });
        const response = await createCard(request, { params: mockParams(columns[columnIndex].id) });
        const data = await response.json();
        cards.push(data);
      }
      
      // 4. Move a card from 'To Do' to 'In Progress'
      const cardToMove = cards.find(card => card.columnId === columns[0].id);
      if (cardToMove) {
        const moveRequest = mockRequest('PATCH', { columnId: columns[1].id });
        await updateCard(moveRequest, { params: mockParams(cardToMove.id) });
      }
      
      // 5. Archive a card
      const cardToArchive = cards[cards.length - 1];
      const archiveRequest = mockRequest('PATCH', { status: 'archived' });
      await updateCard(archiveRequest, { params: mockParams(cardToArchive.id) });
      
      // 6. Get final board state
      const getFinalRequest = mockRequest('GET');
      const getFinalResponse = await getBoard(getFinalRequest, { params: mockParams(boardId) });
      const finalData = await getFinalResponse.json();
      
      // Verify final state
      expect(finalData.board.title).toBe('Full Workflow Board');
      expect(finalData.columns).toHaveLength(3);
      expect(finalData.cards).toHaveLength(4); // 5 created - 1 archived
      
      // Verify card distribution
      const todoCards = finalData.cards.filter((card: any) => card.columnId === columns[0].id);
      const inProgressCards = finalData.cards.filter((card: any) => card.columnId === columns[1].id);
      const doneCards = finalData.cards.filter((card: any) => card.columnId === columns[2].id);
      
      expect(todoCards.length + inProgressCards.length + doneCards.length).toBe(4);
    });
  });
});