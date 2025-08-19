"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Card } from "./Card";
import { Column } from "./Column";
import { BoardToolbar } from "./BoardToolbar";
import { BoardGrid } from "./BoardGrid";
import { CardDetailSheet } from "@/components/drawer/CardDetailSheet";
import { BoardSkeleton } from "./BoardSkeleton";
import { useBoardState } from "./hooks/useBoardState";
import { useDragAndDrop } from "./hooks/useDragAndDrop";

interface BoardProps {
  boardId: string;
}

export function Board({ boardId }: BoardProps) {
  const boardState = useBoardState(boardId);
  
  const dragAndDrop = useDragAndDrop({
    boardId,
    columns: boardState.columns,
    cards: boardState.cards,
    updateCardMutation: boardState.updateCardMutation,
    updateColumnMutation: boardState.updateColumnMutation,
  });

  // Loading and error states
  if (boardState.isLoading) {
    return <BoardSkeleton />;
  }

  if (boardState.error) {
    return (
      <div className="min-h-screen bg-slate-200 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading board</p>
          <p className="text-slate-600 text-sm">{boardState.error.message}</p>
        </div>
      </div>
    );
  }

  if (!boardState.data) {
    return (
      <div className="min-h-screen bg-slate-200 p-4 flex items-center justify-center">
        <p className="text-slate-600">Board not found or failed to load.</p>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={dragAndDrop.sensors}
      modifiers={[restrictToWindowEdges]}
      onDragStart={dragAndDrop.handleDragStart}
      onDragEnd={dragAndDrop.handleDragEnd}
    >
      <div className="h-screen bg-slate-200 p-4 flex flex-col">
        {/* Board Header and Actions - Fixed height */}
        <div className="flex-shrink-0">
          <BoardToolbar
            boardTitle={boardState.data.board?.title}
            isEditingBoardTitle={boardState.isEditingBoardTitle}
            editBoardTitle={boardState.editBoardTitle}
            setEditBoardTitle={boardState.setEditBoardTitle}
            setIsEditingBoardTitle={boardState.setIsEditingBoardTitle}
            handleBoardTitleSave={boardState.handleBoardTitleSave}
            newColumnTitle={boardState.newColumnTitle}
            setNewColumnTitle={boardState.setNewColumnTitle}
            isCreateColumnDialogOpen={boardState.isCreateColumnDialogOpen}
            setIsCreateColumnDialogOpen={boardState.setIsCreateColumnDialogOpen}
            createColumnMutation={boardState.createColumnMutation}
            boardId={boardId}
          />
        </div>
        
        {/* Board Grid - Takes remaining height */}
        <div className="flex-1 min-h-0">
          <BoardGrid
            columns={boardState.columns}
            cards={boardState.cards}
            onCardCreated={boardState.handleOpenCard}
            onCardClick={boardState.handleOpenCard}
            newColumnTitle={boardState.newColumnTitle}
            setNewColumnTitle={boardState.setNewColumnTitle}
            isCreateColumnDialogOpen={boardState.isCreateColumnDialogOpen}
            setIsCreateColumnDialogOpen={boardState.setIsCreateColumnDialogOpen}
            createColumnMutation={boardState.createColumnMutation}
            boardId={boardId}
          />
        </div>
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
      }}>
        {dragAndDrop.activeItem?.type === "Card" && dragAndDrop.activeItem.card && (
          <div className="transform rotate-6 shadow-2xl opacity-95">
            <Card card={dragAndDrop.activeItem.card} onCardClick={boardState.handleOpenCard} allCards={boardState.cards} />
          </div>
        )}
        {dragAndDrop.activeItem?.type === "Column" && dragAndDrop.activeItem.column && (
          <div className="transform rotate-2 shadow-2xl opacity-95">
            <Column 
              column={dragAndDrop.activeItem.column} 
              cards={boardState.cards.filter((card: any) => card.columnId === dragAndDrop.activeItem.column.id)}
              onCardCreated={boardState.handleOpenCard}
              onCardClick={boardState.handleOpenCard}
              allCards={boardState.cards}
            />
          </div>
        )}
      </DragOverlay>
      
      {/* Card Detail Sheet */}
      {boardState.selectedCardId && (() => {
        const selectedCard = boardState.cards.find((card: any) => card.id === boardState.selectedCardId);
        return selectedCard ? (
          <CardDetailSheet 
            card={selectedCard} 
            isOpen={!!boardState.selectedCardId} 
            onClose={boardState.handleCloseCard}
            boardId={boardId}
          />
        ) : null;
      })()}
    </DndContext>
  );
}