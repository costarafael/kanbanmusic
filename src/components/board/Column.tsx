"use client";

import { useDroppable, useDndContext } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card as ShadCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Archive, Edit2, GripVertical, Image } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { InlineCoverEditor } from "@/components/cover/InlineCoverEditor";

interface ColumnProps {
  column: any;
  cards: any[];
  onCardCreated?: (cardId: string) => void;
  onCardClick?: (cardId: string) => void;
}

async function createCard(newCard: { title: string; columnId: string }) {
  const res = await fetch(`/api/columns/${newCard.columnId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newCard.title }),
  });
  if (!res.ok) {
    throw new Error("Failed to create card");
  }
  return res.json();
}

async function updateColumn(columnData: { id: string; title?: string; status?: string; coverUrl?: string }) {
  const res = await fetch(`/api/columns/${columnData.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(columnData),
  });
  if (!res.ok) {
    throw new Error("Failed to update column");
  }
  return res.json();
}

export function Column({ column, cards, onCardCreated, onCardClick }: ColumnProps) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { active } = useDndContext();
  
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "Column", column },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { mutate: createCardMutation } = useMutation({
    mutationFn: createCard,
    onSuccess: (newCard) => {
      queryClient.invalidateQueries({ queryKey: ["board", column.boardId] });
      setNewCardTitle("");
      setIsAddCardDialogOpen(false);
      // Auto-open the newly created card for editing with a small delay
      if (onCardCreated && newCard?.id) {
        setTimeout(() => {
          onCardCreated(newCard.id);
        }, 100);
      }
    },
  });

  const { mutate: updateColumnMutation } = useMutation({
    mutationFn: updateColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", column.boardId] });
      setIsEditingTitle(false);
    },
  });

  const handleTitleSave = () => {
    if (editTitle !== column.title) {
      updateColumnMutation({ id: column.id, title: editTitle });
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleArchiveColumn = () => {
    updateColumnMutation({ id: column.id, status: "archived" });
  };

  const handleCoverUrlChange = (url: string) => {
    updateColumnMutation({ id: column.id, coverUrl: url });
  };

  const handleCloseCoverDialog = () => {
    setIsEditingCover(false);
  };

  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setSortableRef(node);
  };

  return (
    <ShadCard 
      ref={setNodeRef}
      style={style}
      className={`w-80 relative transition-all duration-200 bg-neutral-50 ${
        isDragging ? "opacity-50 scale-105" : "opacity-100"
      } ${
        isOver && active?.data.current?.type === "Card" 
          ? "ring-2 ring-blue-400 ring-opacity-50 bg-blue-50" 
          : ""
      }`}
      {...attributes}
    >
      {/* Inline Cover Editor */}
      {isEditingCover && (
        <InlineCoverEditor
          currentUrl={column.coverUrl || ""}
          onCoverUrlChange={handleCoverUrlChange}
          onClose={handleCloseCoverDialog}
        />
      )}
      
      {/* Cover image */}
      {column.coverUrl && (
        <div className="aspect-square w-full overflow-hidden">
          <img 
            src={column.coverUrl} 
            alt={column.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardHeader className={column.coverUrl ? "pt-3" : ""}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 flex-1">
            <div 
              {...listeners}
              className="cursor-grab opacity-50 hover:opacity-80 p-1 -ml-1"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            {isEditingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setEditTitle(column.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-lg font-semibold"
                autoFocus
              />
            ) : (
              <CardTitle 
                className="cursor-pointer line-clamp-2 leading-tight" 
                onClick={() => setIsEditingTitle(true)}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word'
                }}
              >
                {column.title}
              </CardTitle>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm" 
                  className="hover:scale-105 transition-transform duration-200 h-8 w-8 p-0"
                >
                  +
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Create new card</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Card title</label>
                    <Input 
                      placeholder="Enter card title..." 
                      value={newCardTitle} 
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCardTitle.trim()) {
                          createCardMutation({ title: newCardTitle, columnId: column.id });
                        }
                      }}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <Button 
                      onClick={() => createCardMutation({ title: newCardTitle, columnId: column.id })}
                      disabled={!newCardTitle.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Create Card
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditingCover(true)}>
                  <Image className="mr-2 h-4 w-4" />
                  Edit cover
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchiveColumn}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-[200px] p-4">
        <SortableContext 
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length > 0 ? (
            <>
              {cards.map((card) => <Card key={card.id} card={card} onCardClick={onCardClick} />)}
              
              {/* Add Card Button at the end */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200 h-10 text-gray-500 hover:text-gray-700"
                onClick={() => setIsAddCardDialogOpen(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Card
              </Button>
            </>
          ) : (
            <div 
              className="flex flex-col items-center justify-center h-32 text-center p-4 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors duration-200"
              onClick={() => setIsAddCardDialogOpen(true)}
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">No cards yet</p>
              <p className="text-slate-400 text-xs mt-1">Click here to add your first card</p>
            </div>
          )}
        </SortableContext>
      </CardContent>

    </ShadCard>
  );
}
