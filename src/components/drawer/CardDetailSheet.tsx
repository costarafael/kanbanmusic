"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Archive, MoreHorizontal } from "lucide-react";
import { TagsInput } from "@/components/ui/tags-input";
import { useQuery } from "@tanstack/react-query";

interface CardDetailSheetProps {
  card: any;
  isOpen: boolean;
  onClose: () => void;
  boardId?: string;
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

export function CardDetailSheet({ card, isOpen, onClose, boardId }: CardDetailSheetProps) {
  const [title, setTitle] = useState(card?.title || "");
  const [audioUrl, setAudioUrl] = useState(card?.audioUrl || "");
  const [coverUrl, setCoverUrl] = useState(card?.coverUrl || "");
  const [rating, setRating] = useState(card?.rating || 0);
  const [tags, setTags] = useState<string[]>(card?.tags || []);
  const [showDescriptionInPreview, setShowDescriptionInPreview] = useState(card?.showDescriptionInPreview || false);
  const [showTagsInPreview, setShowTagsInPreview] = useState(card?.showTagsInPreview !== false); // Default true
  const [musicAiNotes, setMusicAiNotes] = useState(card?.music_ai_notes || "");
  const queryClient = useQueryClient();

  // Fetch board tags for autocomplete
  const { data: boardTags } = useQuery({
    queryKey: ["board-tags", boardId || getBoardIdFromCard()],
    queryFn: async () => {
      const currentBoardId = boardId || getBoardIdFromCard();
      if (!currentBoardId) return { tags: [] };
      const response = await fetch(`/api/boards/${currentBoardId}/tags`);
      if (!response.ok) return { tags: [] };
      return response.json();
    },
    enabled: !!(boardId || card?.columnId),
  });

  // Helper function to get board ID - this might need adjustment based on your routing
  function getBoardIdFromCard() {
    // This is a temporary solution - you might need to pass boardId as prop
    // or extract it from the current URL
    const url = window.location.pathname;
    const match = url.match(/\/b\/([^\/]+)/);
    return match ? match[1] : "";
  }

  // Sync state when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title || "");
      setAudioUrl(card.audioUrl || "");
      setCoverUrl(card.coverUrl || "");
      setRating(card.rating || 0);
      setTags(card.tags || []);
      setShowDescriptionInPreview(card.showDescriptionInPreview || false);
      setShowTagsInPreview(card.showTagsInPreview !== false);
      setMusicAiNotes(card.music_ai_notes || "");
    }
  }, [card]);

  const { mutate: updateCardMutation } = useMutation({
    mutationFn: updateCard,
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["board"] });
      }
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

  const handleAudioUrlChange = (url: string, aiNotes?: string) => {
    setAudioUrl(url);
    const updateData: any = { id: card.id, audioUrl: url };
    
    // If AI notes are provided from upload, update them too
    if (aiNotes && aiNotes !== musicAiNotes) {
      setMusicAiNotes(aiNotes);
      updateData.music_ai_notes = aiNotes;
    }
    
    updateCardMutation(updateData);
  };

  const handleCoverUrlChange = (url: string) => {
    setCoverUrl(url);
    updateCardMutation({ id: card.id, coverUrl: url });
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    updateCardMutation({ id: card.id, rating: newRating });
  };

  const handleTagsChange = async (newTags: string[]) => {
    setTags(newTags);
    updateCardMutation({ id: card.id, tags: newTags });
    
    // Update board's known tags
    try {
      const currentBoardId = boardId || getBoardIdFromCard();
      if (currentBoardId) {
        await fetch(`/api/boards/${currentBoardId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: newTags }),
        });
        // Invalidate board tags query to refresh autocomplete
        queryClient.invalidateQueries({ queryKey: ["board-tags"] });
      }
    } catch (error) {
      console.error('Failed to update board tags:', error);
    }
  };

  const handleShowDescriptionToggle = (checked: boolean) => {
    setShowDescriptionInPreview(checked);
    updateCardMutation({ id: card.id, showDescriptionInPreview: checked });
  };

  const handleShowTagsToggle = (checked: boolean) => {
    setShowTagsInPreview(checked);
    updateCardMutation({ id: card.id, showTagsInPreview: checked });
  };

  const handleMusicAiNotesChange = () => {
    if (musicAiNotes !== (card.music_ai_notes || "")) {
      updateCardMutation({ id: card.id, music_ai_notes: musicAiNotes });
    }
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
      <DialogContent className="max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="card-detail-description">
        <DialogHeader className="flex-shrink-0">
          <DialogDescription id="card-detail-description" className="sr-only">
            Edit card details including title, audio, cover, rating, tags, and description
          </DialogDescription>
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
          <div className="flex gap-4">
            {/* Left Column - Cover and Rating */}
            <div className="w-36 flex-shrink-0 space-y-6">
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

            {/* Right Column - Audio, Description */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Audio Section - First in right column */}
              <div>
                <AudioUploadTabs
                  currentUrl={audioUrl}
                  onAudioUrlChange={handleAudioUrlChange}
                  currentCoverUrl={coverUrl}
                  onCoverUrlChange={handleCoverUrlChange}
                />
                {audioUrl && (
                  <div className="mt-4">
                    <MiniPlayer audioUrl={audioUrl} cardId={card.id} />
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Tags</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Show in preview</span>
                    <Switch
                      checked={showTagsInPreview}
                      onCheckedChange={handleShowTagsToggle}
                      size="sm"
                    />
                  </div>
                </div>
                <TagsInput
                  tags={tags}
                  onTagsChange={handleTagsChange}
                  suggestions={boardTags?.tags || []}
                  placeholder="Add tags like 'rock indie', 'summer songs'..."
                />
              </div>

              {/* Music AI Notes Section - Always show if audio exists */}
              {audioUrl && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Music AI Notes</span>
                    <span className="text-xs text-slate-400">
                      {musicAiNotes ? "AI-generated analysis" : "AI analysis not available"}
                    </span>
                  </div>
                  <Textarea
                    value={musicAiNotes}
                    onChange={(e) => setMusicAiNotes(e.target.value)}
                    onBlur={handleMusicAiNotesChange}
                    placeholder={musicAiNotes ? "AI-generated music analysis..." : "AI music analysis is currently not available. The LP-MusicCaps model is not deployed on Hugging Face Inference API. You can add manual notes here."}
                    className="min-h-[120px] text-sm"
                    readOnly={false}
                  />
                </div>
              )}

              {/* Description Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Description</span>
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