import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CardUpdateData {
  id: string;
  title?: string;
  description?: object;
  audioUrl?: string;
  order?: number;
  columnId?: string;
  status?: string;
}

async function fetchBoardData(boardId: string) {
  console.log('Fetching board data for:', boardId);
  const startTime = Date.now();
  
  try {
    const res = await fetch(`/api/boards/${boardId}`);
    const endTime = Date.now();
    
    console.log(`Fetch completed in ${endTime - startTime}ms`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Fetch failed:', res.status, errorText);
      throw new Error(`Failed to fetch board data: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Board data received:', data);
    return data;
  } catch (error) {
    console.error('fetchBoardData error:', error);
    throw error;
  }
}

async function updateCard(card: CardUpdateData) {
  const res = await fetch(`/api/cards/${card.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
  if (!res.ok) {
    throw new Error("Failed to update card");
  }
  return res.json();
}

async function updateColumn(column: { id: string; order?: number }) {
  const res = await fetch(`/api/columns/${column.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(column),
  });
  if (!res.ok) {
    throw new Error("Failed to update column");
  }
  return res.json();
}

async function createColumn(newColumn: { title: string; boardId: string }) {
  const res = await fetch(`/api/boards/${newColumn.boardId}/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newColumn.title }),
  });
  if (!res.ok) {
    throw new Error("Failed to create column");
  }
  return res.json();
}

async function updateBoard(boardData: { id: string; title?: string }) {
  const res = await fetch(`/api/boards/${boardData.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(boardData),
  });
  if (!res.ok) {
    throw new Error("Failed to update board");
  }
  return res.json();
}

export function useBoardState(boardId: string) {
  // UI State
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState("");
  const [isCreateColumnDialogOpen, setIsCreateColumnDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => fetchBoardData(boardId),
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Card mutation with optimistic updates
  const { mutate: updateCardMutation } = useMutation({ 
    mutationFn: updateCard,
    onMutate: async (newCardData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(["board", boardId]);
      
      // Optimistically update cache
      queryClient.setQueryData(["board", boardId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          cards: old.cards.map((card: any) => 
            card.id === newCardData.id 
              ? { ...card, ...newCardData }
              : card
          )
        };
      });
      
      return { previousData };
    },
    onError: (err, newCardData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["board", boardId], context.previousData);
      }
    },
    onSettled: () => {
      // Silently refetch in background to sync with server, without showing loading state
      queryClient.refetchQueries({ queryKey: ["board", boardId] });
    }
  });

  // Column mutation with optimistic updates
  const { mutate: updateColumnMutation } = useMutation({ 
    mutationFn: updateColumn,
    onMutate: async (newColumnData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(["board", boardId]);
      
      // Optimistically update cache
      queryClient.setQueryData(["board", boardId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          columns: old.columns.map((column: any) => 
            column.id === newColumnData.id 
              ? { ...column, ...newColumnData }
              : column
          )
        };
      });
      
      return { previousData };
    },
    onError: (err, newColumnData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["board", boardId], context.previousData);
      }
    },
    onSettled: () => {
      // Silently refetch in background to sync with server, without showing loading state
      queryClient.refetchQueries({ queryKey: ["board", boardId] });
    }
  });

  // Create column mutation
  const { mutate: createColumnMutation } = useMutation({
    mutationFn: createColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId]});
      setNewColumnTitle("");
      setIsCreateColumnDialogOpen(false);
    },
  });

  // Update board mutation
  const { mutate: updateBoardMutation } = useMutation({
    mutationFn: updateBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      setIsEditingBoardTitle(false);
    },
  });

  // Handlers
  const handleOpenCard = (cardId: string) => {
    setSelectedCardId(cardId);
  };

  const handleCloseCard = () => {
    setSelectedCardId(null);
  };

  const handleBoardTitleSave = () => {
    if (data?.board && editBoardTitle !== data.board.title) {
      updateBoardMutation({ id: boardId, title: editBoardTitle });
    } else {
      setIsEditingBoardTitle(false);
    }
  };

  // Initialize board title when data loads
  useEffect(() => {
    if (data?.board?.title && !isEditingBoardTitle) {
      setEditBoardTitle(data.board.title);
    }
  }, [data?.board?.title, isEditingBoardTitle]);

  // Derived data
  const { columns = [], cards = [] } = data || {};

  return {
    // Data
    data,
    columns,
    cards,
    isLoading,
    error,
    
    // UI State
    newColumnTitle,
    setNewColumnTitle,
    selectedCardId,
    isEditingBoardTitle,
    setIsEditingBoardTitle,
    editBoardTitle,
    setEditBoardTitle,
    isCreateColumnDialogOpen,
    setIsCreateColumnDialogOpen,
    
    // Mutations
    updateCardMutation,
    updateColumnMutation,
    createColumnMutation,
    updateBoardMutation,
    
    // Handlers
    handleOpenCard,
    handleCloseCard,
    handleBoardTitleSave,
  };
}