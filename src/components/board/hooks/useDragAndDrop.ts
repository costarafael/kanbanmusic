import { useState } from 'react';
import { DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";

interface UseDragAndDropProps {
  boardId: string;
  columns: any[];
  cards: any[];
  updateCardMutation: (data: any) => void;
  updateColumnMutation: (data: any) => void;
}

export function useDragAndDrop({
  boardId,
  columns,
  cards,
  updateCardMutation,
  updateColumnMutation,
}: UseDragAndDropProps) {
  const [activeItem, setActiveItem] = useState<any>(null);
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

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

  return {
    sensors,
    activeItem,
    handleDragStart,
    handleDragEnd,
  };
}