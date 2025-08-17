import { NextRequest } from 'next/server';
import { POST } from '../[id]/cards/route';
import { PATCH, DELETE } from '../../cards/[id]/route';
import { Board, Column, Card } from '@/lib/db/models';
import dbConnect from '@/lib/db';

const mockRequest = (method: string, body?: any, pathname?: string) => {
  const request = {
    json: jest.fn().mockResolvedValue(body || {}),
    nextUrl: {
      pathname: pathname || '/api/columns/test/cards',
    },
  } as unknown as NextRequest;
  
  return request;
};

describe('/api/columns/[id]/cards', () => {
  let testBoardId: string;
  let testColumnId: string;

  beforeEach(async () => {
    await dbConnect();
    
    const board = await Board.create({
      id: 'test-board-cards',
      title: 'Test Board for Cards'
    });
    testBoardId = board.id;

    const column = await Column.create({
      id: 'test-column-cards',
      title: 'Test Column for Cards',
      boardId: testBoardId,
      order: 0
    });
    testColumnId = column.id;
  });

  describe('POST /api/columns/[id]/cards', () => {
    it('should create a new card', async () => {
      const request = mockRequest('POST', { title: 'New Card' }, `/api/columns/${testColumnId}/cards`);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title', 'New Card');
      expect(data).toHaveProperty('columnId', testColumnId);
      expect(data).toHaveProperty('order', 0);
      expect(data).toHaveProperty('status', 'active');
    });

    it('should set correct order for multiple cards', async () => {
      // Create first card
      await POST(mockRequest('POST', { title: 'Card 1' }, `/api/columns/${testColumnId}/cards`));
      
      // Create second card
      const request = mockRequest('POST', { title: 'Card 2' }, `/api/columns/${testColumnId}/cards`);
      const response = await POST(request);
      const data = await response.json();

      expect(data.order).toBe(1);
    });

    it('should return 400 for invalid title (empty)', async () => {
      const request = mockRequest('POST', { title: '' }, `/api/columns/${testColumnId}/cards`);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid input data');
    });

    it('should return 400 for missing column ID', async () => {
      const request = mockRequest('POST', { title: 'Card' }, '/api/columns//cards');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Column ID not found in URL');
    });

    it('should return 400 for title too long', async () => {
      const longTitle = 'a'.repeat(201);
      const request = mockRequest('POST', { title: longTitle }, `/api/columns/${testColumnId}/cards`);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid input data');
    });
  });

  describe('PATCH /api/cards/[id]', () => {
    let testCardId: string;

    beforeEach(async () => {
      const card = await Card.create({
        id: 'test-card-1',
        title: 'Test Card',
        columnId: testColumnId,
        order: 0
      });
      testCardId = card.id;
    });

    it('should update card title', async () => {
      const request = mockRequest('PATCH', { title: 'Updated Card' }, `/api/cards/${testCardId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Card');
    });

    it('should update card description', async () => {
      const description = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test description' }] }] };
      const request = mockRequest('PATCH', { description }, `/api/cards/${testCardId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.description).toEqual(description);
    });

    it('should update card audio URL', async () => {
      const audioUrl = 'https://example.com/audio.mp3';
      const request = mockRequest('PATCH', { audioUrl }, `/api/cards/${testCardId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.audioUrl).toBe(audioUrl);
    });

    it('should update card order', async () => {
      const request = mockRequest('PATCH', { order: 5 }, `/api/cards/${testCardId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.order).toBe(5);
    });

    it('should move card to different column', async () => {
      // Create another column
      const newColumn = await Column.create({
        id: 'test-column-2',
        title: 'New Column',
        boardId: testBoardId,
        order: 1
      });

      const request = mockRequest('PATCH', { columnId: newColumn.id }, `/api/cards/${testCardId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.columnId).toBe(newColumn.id);
    });

    it('should archive card', async () => {
      const request = mockRequest('PATCH', { status: 'archived' }, `/api/cards/${testCardId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('archived');
    });

    it('should return 400 for invalid audio URL', async () => {
      const request = mockRequest('PATCH', { audioUrl: 'invalid-url' }, `/api/cards/${testCardId}`);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid input data');
    });

    it('should return 404 for non-existent card', async () => {
      const request = mockRequest('PATCH', { title: 'Updated' }, '/api/cards/non-existent');
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Card not found');
    });
  });

  describe('DELETE /api/cards/[id]', () => {
    let testCardId: string;

    beforeEach(async () => {
      const card = await Card.create({
        id: 'test-card-delete',
        title: 'Test Card for Delete',
        columnId: testColumnId,
        order: 0,
        status: 'archived'
      });
      testCardId = card.id;
    });

    it('should delete archived card', async () => {
      const request = mockRequest('DELETE', undefined, `/api/cards/${testCardId}`);
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Card deleted successfully');

      // Verify card is actually deleted
      const deletedCard = await Card.findOne({ id: testCardId });
      expect(deletedCard).toBeNull();
    });

    it('should return 404 for active card', async () => {
      // Update card to active
      await Card.findOneAndUpdate({ id: testCardId }, { status: 'active' });

      const request = mockRequest('DELETE', undefined, `/api/cards/${testCardId}`);
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Card not found or not archived');
    });

    it('should return 404 for non-existent card', async () => {
      const request = mockRequest('DELETE', undefined, '/api/cards/non-existent');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Card not found or not archived');
    });
  });
});