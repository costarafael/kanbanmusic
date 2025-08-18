"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TrashView } from "./TrashView";

interface BoardToolbarProps {
  boardTitle?: string;
  isEditingBoardTitle: boolean;
  editBoardTitle: string;
  setEditBoardTitle: (title: string) => void;
  setIsEditingBoardTitle: (editing: boolean) => void;
  handleBoardTitleSave: () => void;
  
  newColumnTitle: string;
  setNewColumnTitle: (title: string) => void;
  isCreateColumnDialogOpen: boolean;
  setIsCreateColumnDialogOpen: (open: boolean) => void;
  createColumnMutation: (data: { title: string; boardId: string }) => void;
  boardId: string;
}

export function BoardToolbar({
  boardTitle,
  isEditingBoardTitle,
  editBoardTitle,
  setEditBoardTitle,
  setIsEditingBoardTitle,
  handleBoardTitleSave,
  newColumnTitle,
  setNewColumnTitle,
  isCreateColumnDialogOpen,
  setIsCreateColumnDialogOpen,
  createColumnMutation,
  boardId,
}: BoardToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      {/* Board Title */}
      {isEditingBoardTitle ? (
        <Input
          value={editBoardTitle}
          onChange={(e) => setEditBoardTitle(e.target.value)}
          onBlur={handleBoardTitleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleBoardTitleSave();
            if (e.key === "Escape") {
              setEditBoardTitle(boardTitle || "");
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
          {boardTitle}
        </h1>
      )}
      
      {/* Action Buttons */}
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
  );
}