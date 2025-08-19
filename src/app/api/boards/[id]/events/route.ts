import { NextRequest, NextResponse } from 'next/server';

// Global map to store event streams for each board
const boardConnections = new Map<string, Set<WritableStreamDefaultWriter<Uint8Array>>>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  
  if (!boardId) {
    return new NextResponse('Board ID required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Set up SSE headers
      const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      // Send initial connection message
      const encoder = new TextEncoder();
      const sendEvent = (data: any, event = 'message') => {
        const formatted = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formatted));
      };

      // Send initial connection confirmation
      sendEvent({ type: 'connected', boardId, timestamp: Date.now() }, 'connection');

      // Add this connection to the board's connection set
      if (!boardConnections.has(boardId)) {
        boardConnections.set(boardId, new Set());
      }
      
      const writer = controller as any; // Simplified for demo
      boardConnections.get(boardId)?.add(writer);

      // Send periodic keepalive (every 30 seconds)
      const keepAlive = setInterval(() => {
        try {
          sendEvent({ type: 'keepalive', timestamp: Date.now() }, 'keepalive');
        } catch (error) {
          console.error('Error sending keepalive:', error);
          clearInterval(keepAlive);
          controller.close();
        }
      }, 30000);

      // Cleanup function
      const cleanup = () => {
        clearInterval(keepAlive);
        boardConnections.get(boardId)?.delete(writer);
        
        // Remove board connections set if empty
        if (boardConnections.get(boardId)?.size === 0) {
          boardConnections.delete(boardId);
        }
      };

      // Handle client disconnect
      request.signal?.addEventListener('abort', cleanup);

      return cleanup;
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Note: SSE implementation is complex and requires careful handling
// For now, we'll use the polling approach with TanStack Query which is more reliable