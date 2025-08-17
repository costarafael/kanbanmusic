import { NextRequest } from 'next/server';
import { POST } from '../route';
import { GET, PATCH } from '../[id]/route';
import { Board } from '@/lib/db/models';
import dbConnect from '@/lib/db';

// Mock NextRequest
const mockRequest = (method: string, body?: any, pathname?: string) => {
  const request = {
    json: jest.fn().mockResolvedValue(body || {}),
    nextUrl: {
      pathname: pathname || '/api/boards',
    },
  } as unknown as NextRequest;
  
  return request;
};

describe('/api/boards', () => {
  beforeEach(async () => {
    await dbConnect();
  });

  describe('POST /api/boards', () => {
    it('should create a new board with default title', async () => {
      const request = mockRequest('POST', {});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title', 'Novo Board');
    });

    it('should create a new board with custom title', async () => {
      const request = mockRequest('POST', { title: 'Custom Board' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title', 'Custom Board');
    });

    it('should return 400 for invalid title (too long)', async () => {
      const longTitle = 'a'.repeat(101);
      const request = mockRequest('POST', { title: longTitle });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid input data');
    });
  });

  describe('GET /api/boards/[id]', () => {
    it('should return board data with columns and cards', async () => {
      // Create a test board
      const board = await Board.create({
        id: 'test-board-1',
        title: 'Test Board'
      });

      const request = mockRequest('GET', undefined, `/api/boards/${board.id}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('board');
      expect(data).toHaveProperty('columns');
      expect(data).toHaveProperty('cards');
      expect(data.board.id).toBe(board.id);
    });

    it('should return 404 for non-existent board', async () => {
      const request = mockRequest('GET', undefined, '/api/boards/non-existent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Board not found');
    });
  });

  describe('PATCH /api/boards/[id]', () => {
    it('should update board title', async () => {
      const board = await Board.create({
        id: 'test-board-2',
        title: 'Original Title'
      });

      const request = mockRequest('PATCH', { title: 'Updated Title' }, `/api/boards/${board.id}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent board', async () => {
      const request = mockRequest('PATCH', { title: 'Updated' }, '/api/boards/non-existent');
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Board not found');
    });
  });
});