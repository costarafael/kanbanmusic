import { NextRequest } from 'next/server';
import { POST } from '../[id]/columns/route';
import { PATCH, DELETE } from '../../columns/[id]/route';
import { Board, Column } from '@/lib/db/models';
import dbConnect from '@/lib/db';

const mockRequest = (method: string, body?: any, pathname?: string) => {
  const request = {
    json: jest.fn().mockResolvedValue(body || {}),
    nextUrl: {
      pathname: pathname || '/api/boards/test/columns',
    },
  } as unknown as NextRequest;
  
  return request;
};

describe('/api/boards/[id]/columns', () => {
  let testBoardId: string;

  beforeEach(async () => {
    await dbConnect();
    
    const board = await Board.create({
      id: 'test-board-columns',
      title: 'Test Board for Columns'
    });
    testBoardId = board.id;
  });

  describe('POST /api/boards/[id]/columns', () => {
    it('should create a new column', async () => {
      const request = mockRequest('POST', { title: 'New Column' }, `/api/boards/${testBoardId}/columns`);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title', 'New Column');
      expect(data).toHaveProperty('boardId', testBoardId);
      expect(data).toHaveProperty('order', 0);
      expect(data).toHaveProperty('status', 'active');
    });

    it('should set correct order for multiple columns', async () => {
      // Create first column
      await POST(mockRequest('POST', { title: 'Column 1' }, `/api/boards/${testBoardId}/columns`));
      
      // Create second column
      const request = mockRequest('POST', { title: 'Column 2' }, `/api/boards/${testBoardId}/columns`);
      const response = await POST(request);
      const data = await response.json();

      expect(data.order).toBe(1);
    });

    it('should return 400 for invalid title (empty)', async () => {
      const request = mockRequest('POST', { title: '' }, `/api/boards/${testBoardId}/columns`);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid input data');
    });

    it('should return 400 for missing board ID', async () => {
      const request = mockRequest('POST', { title: 'Column' }, '/api/boards//columns');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Board ID not found in URL');
    });
  });

  describe('PATCH /api/columns/[id]', () => {
    let testColumnId: string;

    beforeEach(async () => {
      const column = await Column.create({
        id: 'test-column-1',
        title: 'Test Column',
        boardId: testBoardId,
        order: 0
      });
      testColumnId = column.id;
    });

    it('should update column title', async () => {
      const request = mockRequest('PATCH', { title: 'Updated Column' }, `/api/columns/${testColumnId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Column');
    });

    it('should update column order', async () => {
      const request = mockRequest('PATCH', { order: 5 }, `/api/columns/${testColumnId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.order).toBe(5);
    });

    it('should archive column and its cards', async () => {
      const request = mockRequest('PATCH', { status: 'archived' }, `/api/columns/${testColumnId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('archived');
    });

    it('should return 404 for non-existent column', async () => {
      const request = mockRequest('PATCH', { title: 'Updated' }, '/api/columns/non-existent');
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Column not found');
    });
  });

  describe('DELETE /api/columns/[id]', () => {
    let testColumnId: string;

    beforeEach(async () => {
      const column = await Column.create({
        id: 'test-column-delete',
        title: 'Test Column for Delete',
        boardId: testBoardId,
        order: 0,
        status: 'archived'
      });
      testColumnId = column.id;
    });

    it('should delete archived column', async () => {
      const request = mockRequest('DELETE', undefined, `/api/columns/${testColumnId}`);
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Column deleted successfully');

      // Verify column is actually deleted
      const deletedColumn = await Column.findOne({ id: testColumnId });
      expect(deletedColumn).toBeNull();
    });

    it('should return 404 for active column', async () => {
      // Update column to active
      await Column.findOneAndUpdate({ id: testColumnId }, { status: 'active' });

      const request = mockRequest('DELETE', undefined, `/api/columns/${testColumnId}`);
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Column not found or not archived');
    });
  });
});