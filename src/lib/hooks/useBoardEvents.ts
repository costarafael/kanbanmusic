import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface BoardEvent {
  type: string;
  boardId: string;
  action?: string;
  entity?: 'card' | 'column' | 'board';
  entityId?: string;
  timestamp: number;
  data?: any;
}

export function useBoardEvents(boardId: string | undefined, enabled = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<BoardEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!boardId || !enabled) return;

    console.log('Setting up SSE connection for board:', boardId);

    // Create EventSource connection
    const eventSource = new EventSource(`/api/boards/${boardId}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened for board:', boardId);
      setIsConnected(true);
    };

    eventSource.addEventListener('connection', (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE connection confirmed:', data);
    });

    eventSource.addEventListener('update', (event) => {
      const eventData: BoardEvent = JSON.parse(event.data);
      console.log('Board update received:', eventData);
      
      setLastEvent(eventData);
      
      // Invalidate relevant queries based on the event
      if (eventData.entity === 'card') {
        // Invalidate board data to refresh cards
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      } else if (eventData.entity === 'column') {
        // Invalidate board data to refresh columns
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      } else if (eventData.entity === 'board') {
        // Invalidate board data
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      } else {
        // General update - invalidate all board-related queries
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      }
    });

    eventSource.addEventListener('keepalive', (event) => {
      // Keepalive event - just log it
      console.log('SSE keepalive received');
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('Attempting to reconnect SSE...');
          // The useEffect will run again and create a new connection
        }
      }, 5000);
    };

    // Cleanup function
    return () => {
      console.log('Closing SSE connection for board:', boardId);
      eventSource.close();
      setIsConnected(false);
      eventSourceRef.current = null;
    };
  }, [boardId, enabled, queryClient]);

  // Manual refresh function
  const refresh = () => {
    if (boardId) {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    }
  };

  return {
    isConnected,
    lastEvent,
    refresh,
  };
}