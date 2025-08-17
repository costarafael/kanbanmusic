"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { AudioUploadTabs } from "@/components/audio/AudioUploadTabs";
import { MiniPlayer } from "@/components/audio/MiniPlayer";
import { CoverUploadCompact } from "@/components/cover/CoverUploadCompact";
import { StarRating } from "@/components/ui/star-rating";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Archive, MoreHorizontal } from "lucide-react";

interface CardDetailSheetProps {
  card: any;
  isOpen: boolean;
  onClose: () => void;
}

async function updateCard(cardData: any) {
  const res = await fetch(`/api/cards/${cardData.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cardData),
  });
  if (!res.ok) {
    throw new Error("Failed to update card");
  }
  return res.json();
}

export function CardDetailSheet({ card, isOpen, onClose }: CardDetailSheetProps) {
  const [title, setTitle] = useState(card?.title || "");
  const [audioUrl, setAudioUrl] = useState(card?.audioUrl || "");
  const [coverUrl, setCoverUrl] = useState(card?.coverUrl || "");
  const [rating, setRating] = useState(card?.rating || 0);
  const [showDescriptionInPreview, setShowDescriptionInPreview] = useState(card?.showDescriptionInPreview || false);
  const queryClient = useQueryClient();

  // Sync state when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title || "");
      setAudioUrl(card.audioUrl || "");
      setCoverUrl(card.coverUrl || "");
      setRating(card.rating || 0);
      setShowDescriptionInPreview(card.showDescriptionInPreview || false);
    }
  }, [card]);

  const { mutate: updateCardMutation } = useMutation({
    mutationFn: updateCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });

  const handleTitleChange = () => {
    if (title !== card.title) {
      updateCardMutation({ id: card.id, title });
    }
  };

  const handleDescriptionChange = (description: object) => {
    updateCardMutation({ id: card.id, description });
  };

  const handleAudioUrlChange = (url: string) => {
    setAudioUrl(url);
    updateCardMutation({ id: card.id, audioUrl: url });
  };

  const handleCoverUrlChange = (url: string) => {
    setCoverUrl(url);
    updateCardMutation({ id: card.id, coverUrl: url });
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    updateCardMutation({ id: card.id, rating: newRating });
  };

  const handleShowDescriptionToggle = (checked: boolean) => {
    setShowDescriptionInPreview(checked);
    updateCardMutation({ id: card.id, showDescriptionInPreview: checked });
  };

  const handleArchiveCard = () => {
    updateCardMutation({ id: card.id, status: "archived" });
    onClose();
  };

  // Safety check - if card is undefined, don't render anything
  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle asChild>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleChange()}
                  className="text-lg font-semibold border-none p-0 focus-visible:ring-0 bg-transparent"
                  placeholder="Card title..."
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleArchiveCard}
                    className="text-destructive focus:text-destructive"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Card
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="flex gap-6">
            {/* Left Column - 25% - Cover and Rating */}
            <div className="w-1/4 space-y-6">
              {/* Cover Section */}
              <div>
                <CoverUploadCompact
                  currentUrl={coverUrl}
                  onCoverUrlChange={handleCoverUrlChange}
                  aspectRatio="1:1"
                />
              </div>

              {/* Rating Section */}
              <div>
                <StarRating
                  rating={rating}
                  onRatingChange={handleRatingChange}
                  size="md"
                />
              </div>
            </div>

            {/* Right Column - 75% - Audio, Description */}
            <div className="w-3/4 space-y-6">
              {/* Audio Section - First in right column */}
              <div>
                <AudioUploadTabs
                  currentUrl={audioUrl}
                  onAudioUrlChange={handleAudioUrlChange}
                  currentCoverUrl={coverUrl}
                  onCoverUrlChange={handleCoverUrlChange}
                />
                {audioUrl && (
                  <div className="mt-4 p-3 bg-white rounded-md border border-slate-200">
                    <MiniPlayer audioUrl={audioUrl} cardId={card.id} />
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Show in preview</span>
                    <Switch
                      checked={showDescriptionInPreview}
                      onCheckedChange={handleShowDescriptionToggle}
                      size="sm"
                    />
                  </div>
                </div>
                <RichTextEditor
                  content={card.description || ""}
                  onChange={handleDescriptionChange}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}