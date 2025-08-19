// Utility functions to broadcast board events
// This would be called from API endpoints when changes occur

export interface BoardEventData {
  type: 'update' | 'create' | 'delete';
  entity: 'card' | 'column' | 'board';
  entityId: string;
  boardId: string;
  action?: string;
  data?: any;
}

// This would be implemented with a proper event system
// For now, we'll create a simple in-memory event system
class BoardEventEmitter {
  private listeners = new Map<string, Set<(event: BoardEventData) => void>>();

  subscribe(boardId: string, callback: (event: BoardEventData) => void) {
    if (!this.listeners.has(boardId)) {
      this.listeners.set(boardId, new Set());
    }
    this.listeners.get(boardId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(boardId)?.delete(callback);
      if (this.listeners.get(boardId)?.size === 0) {
        this.listeners.delete(boardId);
      }
    };
  }

  emit(boardId: string, event: BoardEventData) {
    console.log(`Emitting event for board ${boardId}:`, event);
    
    const boardListeners = this.listeners.get(boardId);
    if (boardListeners) {
      boardListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in board event listener:', error);
        }
      });
    }
  }

  // Get active listener count for debugging
  getListenerCount(boardId: string): number {
    return this.listeners.get(boardId)?.size ?? 0;
  }
}

// Global instance
export const boardEventEmitter = new BoardEventEmitter();

// Helper functions for common operations
export function emitCardEvent(
  boardId: string, 
  cardId: string, 
  action: 'created' | 'updated' | 'deleted' | 'moved',
  data?: any
) {
  boardEventEmitter.emit(boardId, {
    type: action === 'deleted' ? 'delete' : action === 'created' ? 'create' : 'update',
    entity: 'card',
    entityId: cardId,
    boardId,
    action,
    data
  });
}

export function emitColumnEvent(
  boardId: string, 
  columnId: string, 
  action: 'created' | 'updated' | 'deleted',
  data?: any
) {
  boardEventEmitter.emit(boardId, {
    type: action === 'deleted' ? 'delete' : action === 'created' ? 'create' : 'update',
    entity: 'column',
    entityId: columnId,
    boardId,
    action,
    data
  });
}

export function emitBoardEvent(
  boardId: string, 
  action: 'updated',
  data?: any
) {
  boardEventEmitter.emit(boardId, {
    type: 'update',
    entity: 'board',
    entityId: boardId,
    boardId,
    action,
    data
  });
}