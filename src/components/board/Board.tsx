"use client";

import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Column } from "./Column";
import { Card } from "./Card";
import { TrashView } from "./TrashView";
import { CardDetailSheet } from "@/components/drawer/CardDetailSheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { BoardSkeleton } from "./BoardSkeleton";

interface BoardProps {
  boardId: string;
}

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
  const res = await fetch(`/api/boards/${boardId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch board data");
  }
  return res.json();
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

export function Board({ boardId }: BoardProps) {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [activeItem, setActiveItem] = useState<any>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState("");
  const [isCreateColumnDialogOpen, setIsCreateColumnDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => fetchBoardData(boardId),
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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

  const { mutate: createColumnMutation } = useMutation({
    mutationFn: createColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId]});
      setNewColumnTitle("");
      setIsCreateColumnDialogOpen(false);
    },
  });

  const { mutate: updateBoardMutation } = useMutation({
    mutationFn: updateBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      setIsEditingBoardTitle(false);
    },
  });

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current);
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveItem(null);
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Moving columns
    if (activeData?.type === "Column" && overData?.type === "Column") {
      const oldIndex = columns.findIndex((col: any) => col.id === activeId);
      const newIndex = columns.findIndex((col: any) => col.id === overId);
      
      const newColumns = arrayMove(columns, oldIndex, newIndex);
      
      // Optimistic update
      queryClient.setQueryData(["board", boardId], (old: any) => ({
        ...old,
        columns: newColumns.map((col: any, index: number) => ({ ...col, order: index }))
      }));
      
      // Server sync
      newColumns.forEach((col: any, index: number) => {
        if (col.order !== index) {
          updateColumnMutation({ id: col.id, order: index });
        }
      });
      return;
    }

    // Moving cards
    if (activeData?.type === "Card") {
      const activeCard = activeData.card;
      
      // Dropping on a column
      if (overData?.type === "Column") {
        const overColumn = overData.column;
        if (activeCard.columnId !== overColumn.id) {
          const targetColumnCards = cards.filter((c: any) => c.columnId === overColumn.id);
          const newOrder = targetColumnCards.length;
          
          // Optimistic update
          queryClient.setQueryData(["board", boardId], (old: any) => ({
            ...old,
            cards: old.cards.map((card: any) => {
              if (card.id === activeCard.id) {
                return { ...card, columnId: overColumn.id, order: newOrder };
              }
              if (card.columnId === activeCard.columnId && card.order > activeCard.order) {
                return { ...card, order: card.order - 1 };
              }
              return card;
            })
          }));
          
          updateCardMutation({ 
            id: activeCard.id, 
            columnId: overColumn.id,
            order: newOrder
          });
        }
        return;
      }

      // Dropping on another card
      if (overData?.type === "Card") {
        const overCard = overData.card;

        if (activeCard.columnId === overCard.columnId) {
          // Same column reordering
          const columnCards = cards.filter((c: any) => c.columnId === activeCard.columnId);
          const oldIndex = columnCards.findIndex((c: any) => c.id === activeCard.id);
          const newIndex = columnCards.findIndex((c: any) => c.id === overCard.id);
          
          const reorderedCards = arrayMove(columnCards, oldIndex, newIndex);
          
          // Optimistic update
          queryClient.setQueryData(["board", boardId], (old: any) => ({
            ...old,
            cards: old.cards.map((card: any) => {
              if (card.columnId === activeCard.columnId) {
                const newIndex = reorderedCards.findIndex((c: any) => c.id === card.id);
                return { ...card, order: newIndex };
              }
              return card;
            })
          }));
          
          // Server sync
          reorderedCards.forEach((card: any, index: number) => {
            updateCardMutation({ id: card.id, order: index });
          });
        } else {
          // Moving to different column
          const targetColumnCards = cards.filter((c: any) => c.columnId === overCard.columnId);
          const insertIndex = targetColumnCards.findIndex((c: any) => c.id === overCard.id);
          
          // Optimistic update
          queryClient.setQueryData(["board", boardId], (old: any) => ({
            ...old,
            cards: old.cards.map((card: any) => {
              if (card.id === activeCard.id) {
                return { ...card, columnId: overCard.columnId, order: insertIndex };
              }
              if (card.columnId === overCard.columnId && card.order >= insertIndex) {
                return { ...card, order: card.order + 1 };
              }
              if (card.columnId === activeCard.columnId && card.order > activeCard.order) {
                return { ...card, order: card.order - 1 };
              }
              return card;
            })
          }));
          
          updateCardMutation({
            id: activeCard.id,
            columnId: overCard.columnId,
            order: insertIndex
          });
        }
      }
    }
  };

  if (isLoading) {
    return <BoardSkeleton />;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-200 p-4 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 mb-2">Error loading board</p>
        <p className="text-slate-600 text-sm">{error.message}</p>
      </div>
    </div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-slate-200 p-4 flex items-center justify-center">
      <p className="text-slate-600">Board not found or failed to load.</p>
    </div>;
  }

  const { columns, cards } = data;

  return (
    <DndContext 
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          {isEditingBoardTitle ? (
            <Input
              value={editBoardTitle}
              onChange={(e) => setEditBoardTitle(e.target.value)}
              onBlur={handleBoardTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleBoardTitleSave();
                if (e.key === "Escape") {
                  setEditBoardTitle(data?.board?.title || "");
                  setIsEditingBoardTitle(false);
                }
              }}
              className="text-2xl font-bold border-none p-0 focus-visible:ring-0 bg-transparent text-slate-800"
              autoFocus
            />
          ) : (
            <h1 
              className="text-2xl font-bold text-slate-800 cursor-pointer hover:text-slate-600 transition-colors"
              onClick={() => setIsEditingBoardTitle(true)}
            >
              {data?.board?.title}
            </h1>
          )}
          <div className="flex items-center gap-3">
            <Dialog open={isCreateColumnDialogOpen} onOpenChange={setIsCreateColumnDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost">+ Column</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a new column</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Input 
                    placeholder="Column title" 
                    value={newColumnTitle} 
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newColumnTitle.trim()) {
                        createColumnMutation({ title: newColumnTitle, boardId });
                      }
                    }}
                  />
                  <Button 
                    onClick={() => createColumnMutation({ title: newColumnTitle, boardId })}
                    disabled={!newColumnTitle.trim()}
                  >
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <TrashView />
          </div>
        </div>
        {columns.length > 0 ? (
          <SortableContext 
            items={columns.map((col: any) => col.id)} 
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-5 overflow-x-auto pb-4">
              {columns.map((column: any) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={cards.filter((card: any) => card.columnId === column.id)}
                  onCardCreated={handleOpenCard}
                  onCardClick={handleOpenCard}
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">This board has no columns. Create one to get started!</p>
          </div>
        )}
      </div>
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
      }}>
        {activeItem?.type === "Card" && activeItem.card && (
          <div className="transform rotate-6 shadow-2xl opacity-95">
            <Card card={activeItem.card} onCardClick={handleOpenCard} />
          </div>
        )}
        {activeItem?.type === "Column" && activeItem.column && (
          <div className="transform rotate-2 shadow-2xl opacity-95">
            <Column 
              column={activeItem.column} 
              cards={cards.filter((card: any) => card.columnId === activeItem.column.id)}
              onCardCreated={handleOpenCard}
              onCardClick={handleOpenCard}
            />
          </div>
        )}
      </DragOverlay>
      
      {/* Card Detail Sheet */}
      {selectedCardId && (() => {
        const selectedCard = cards.find((card: any) => card.id === selectedCardId);
        return selectedCard ? (
          <CardDetailSheet 
            card={selectedCard} 
            isOpen={!!selectedCardId} 
            onClose={handleCloseCard} 
          />
        ) : null;
      })()}
    </DndContext>
  );
}
