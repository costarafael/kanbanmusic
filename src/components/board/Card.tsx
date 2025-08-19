"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CompactPlayer } from "@/components/audio/CompactPlayer";
import { StarRating } from "@/components/ui/star-rating";
import { Card as ShadCard, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { extractPlainText, truncateToLines } from "@/lib/utils/description-helpers";
import { Music, List } from "lucide-react";

interface CardProps {
  card: any;
  onCardClick?: (cardId: string) => void;
  allCards?: any[]; // Para contar playlists que incluem este card
}

export function Card({ card, onCardClick, allCards = [] }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.id,
    data: { type: "Card", card },
  });

  const { isOver } = useDroppable({
    id: `${card.id}-dropzone`,
    data: { type: "Card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { active } = useDndContext();
  const isDragging = active?.id === card.id;
  const isBeingDraggedOver = isOver && active?.id !== card.id && active?.data.current?.type === "Card";

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isDragging && onCardClick) {
      e.stopPropagation();
      onCardClick(card.id);
    }
  };

  // Contar quantas playlists incluem este card (apenas se não for playlist)
  const playlistCount = !card.isPlaylist 
    ? allCards.filter(c => 
        c.isPlaylist && 
        c.playlistItems?.some((item: any) => item.cardId === card.id)
      ).length 
    : 0;

  return (
    <>
      <ShadCard
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`mb-2 relative transition-all duration-200 ${
          isDragging ? "opacity-30" : "opacity-100"
        } ${
          isBeingDraggedOver ? "border-2 border-dashed border-blue-400 bg-blue-50 transform scale-105" : "hover:scale-[1.01]"
        }`}
      >
        {/* Drag handle - only for dragging */}
        <div 
          {...listeners}
          className="absolute top-2 right-2 w-4 h-4 cursor-grab opacity-20 hover:opacity-50 z-10 transition-opacity duration-200 rounded-sm"
          style={{ 
            background: 'radial-gradient(circle, #64748b 1px, transparent 1px)', 
            backgroundSize: '3px 3px',
            backgroundPosition: '1px 1px'
          }}
        />
        
        {/* Card content - clickable for opening sheet */}
        <div onClick={handleCardClick} className="cursor-pointer">
          <CardHeader className="p-2 pb-1">
            {/* Title with optional avatar */}
            <div className="flex items-start gap-3 mb-2">
              {/* Avatar cover */}
              {card.coverUrl && (
                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src={card.coverUrl} 
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <CardTitle className="text-sm leading-tight">{card.title}</CardTitle>
                
                {/* Rating */}
                {card.rating > 0 && (
                  <div className="flex justify-start">
                    <StarRating rating={card.rating || 0} readonly size="sm" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Playlist preview - show first 3 playlist items if in playlist mode */}
            {card.isPlaylist && card.playlistItems && card.playlistItems.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  Playlist ({card.playlistItems.length} tracks)
                </div>
                <div className="space-y-1">
                  {card.playlistItems.slice(0, 3).map((item: any, index: number) => (
                    <div key={`${item.cardId}-${index}`} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-center text-slate-400">{index + 1}</span>
                      <span className="flex-1 truncate text-slate-600">
                        {item.title || `Track ${index + 1}`}
                      </span>
                      {!item.audioUrl && (
                        <Badge variant="outline" className="text-xs border-slate-300 text-slate-400 px-1 py-0">
                          No audio
                        </Badge>
                      )}
                    </div>
                  ))}
                  {card.playlistItems.length > 3 && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-4 text-center">⋯</span>
                      <span className="flex-1">+{card.playlistItems.length - 3} outros</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags preview - show by default if tags exist and not explicitly disabled, but not for playlist cards */}
            {!card.isPlaylist && card.showTagsInPreview !== false && card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 px-0">
                {card.tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-1 rounded-sm bg-gray-100 text-gray-600 border-0">
                    {tag}
                  </Badge>
                ))}
                {card.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1 rounded-sm">
                    +{card.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Description preview - only show if enabled, without border/background */}
            {card.showDescriptionInPreview && card.description && (
              <div className="text-xs text-gray-600 mb-2 leading-relaxed whitespace-pre-wrap px-4">
                {truncateToLines(extractPlainText(card.description), 6)}
              </div>
            )}
            
            {/* Playlists count - show if card is included in playlists */}
            {!card.isPlaylist && playlistCount > 0 && (
              <div className="flex items-center gap-1 pt-1">
                <List className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-500">Playlists ({playlistCount})</span>
              </div>
            )}
          </CardHeader>
        </div>
        
        {/* Audio player - separate from clickable area to prevent conflicts, not shown for playlist cards */}
        {card.audioUrl && !card.isPlaylist && (
          <div className="p-0 m-0" onClick={(e) => e.stopPropagation()}>
            <CompactPlayer audioUrl={card.audioUrl} cardId={card.id} />
          </div>
        )}
        
        {/* Extra padding for cards without audio to prevent content from being too close to border */}
        {!card.audioUrl && !card.isPlaylist && (
          <div className="pb-4" />
        )}
      </ShadCard>
    </>
  );
}
