"use client";

import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Column } from "./Column";

interface BoardGridProps {
  columns: any[];
  cards: any[];
  onCardCreated: (cardId: string) => void;
  onCardClick: (cardId: string) => void;
  
  newColumnTitle: string;
  setNewColumnTitle: (title: string) => void;
  isCreateColumnDialogOpen: boolean;
  setIsCreateColumnDialogOpen: (open: boolean) => void;
  createColumnMutation: (data: { title: string; boardId: string }) => void;
  boardId: string;
}

export function BoardGrid({
  columns,
  cards,
  onCardCreated,
  onCardClick,
  newColumnTitle,
  setNewColumnTitle,
  isCreateColumnDialogOpen,
  setIsCreateColumnDialogOpen,
  createColumnMutation,
  boardId,
}: BoardGridProps) {
  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">This board has no columns. Create one to get started!</p>
      </div>
    );
  }

  return (
    <SortableContext 
      items={columns.map((col: any) => col.id)} 
      strategy={horizontalListSortingStrategy}
    >
      <div className="flex gap-5 overflow-x-auto pb-4">
        {/* Existing Columns */}
        {columns.map((column: any) => (
          <Column
            key={column.id}
            column={column}
            cards={cards.filter((card: any) => card.columnId === column.id)}
            onCardCreated={onCardCreated}
            onCardClick={onCardClick}
            allCards={cards}
          />
        ))}
        
        {/* Add Column Button */}
        <div className="w-80 flex-shrink-0">
          <Dialog open={isCreateColumnDialogOpen} onOpenChange={setIsCreateColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200 flex flex-col items-center justify-center gap-2 bg-white/50 hover:bg-white/80"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-gray-500 font-medium">Add Column</span>
              </Button>
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
        </div>
      </div>
    </SortableContext>
  );
}