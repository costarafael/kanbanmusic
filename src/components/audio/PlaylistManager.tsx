"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, GripVertical, Search, Music } from "lucide-react";
import { Card as CardComponent } from "@/components/ui/card";

interface PlaylistItem {
  cardId: string;
  order: number;
  title?: string;
  audioUrl?: string;
  coverUrl?: string;
}

interface PlaylistManagerProps {
  playlistItems: PlaylistItem[];
  onPlaylistChange: (items: PlaylistItem[]) => void;
  boardId?: string;
}

interface SearchResult {
  id: string;
  title: string;
  audioUrl?: string;
  coverUrl?: string;
}

export function PlaylistManager({ playlistItems, onPlaylistChange, boardId }: PlaylistManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Search for cards with audio
  const searchCards = async (term: string) => {
    if (!term.trim() || !boardId) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/boards/${boardId}/cards/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        // Filter only cards with audio and not already in playlist
        const filteredResults = data.cards
          .filter((card: any) => 
            card.audioUrl && 
            !playlistItems.some(item => item.cardId === card.id)
          )
          .map((card: any) => ({
            id: card.id,
            title: card.title,
            audioUrl: card.audioUrl,
            coverUrl: card.coverUrl,
          }));
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Failed to search cards:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCards(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, boardId, playlistItems]);

  const addToPlaylist = (card: SearchResult) => {
    const newItem: PlaylistItem = {
      cardId: card.id,
      order: playlistItems.length,
      title: card.title,
      audioUrl: card.audioUrl,
      coverUrl: card.coverUrl,
    };
    
    onPlaylistChange([...playlistItems, newItem]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeFromPlaylist = (index: number) => {
    const newItems = playlistItems
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }));
    onPlaylistChange(newItems);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...playlistItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    // Update order
    const reorderedItems = newItems.map((item, i) => ({ ...item, order: i }));
    onPlaylistChange(reorderedItems);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    moveItem(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getTotalDuration = () => {
    // This would need to be calculated based on actual card data
    // For now, we'll show a placeholder
    return `${playlistItems.length} tracks`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Playlist</label>
        <Badge variant="secondary" className="text-xs">
          {getTotalDuration()}
        </Badge>
      </div>

      {/* Search for cards */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search cards to add..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search results dropdown */}
        {searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-center text-gray-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((card) => (
                <div
                  key={card.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => addToPlaylist(card)}
                >
                  <div className="flex items-center gap-3">
                    {card.coverUrl ? (
                      <img
                        src={card.coverUrl}
                        alt={card.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <Music className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{card.title}</p>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">
                {searchTerm.length < 2 ? 'Type at least 2 characters' : 'No cards found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Playlist items */}
      <div className="space-y-2">
        {playlistItems.length === 0 ? (
          <div className="text-center p-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <Music className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No tracks in playlist yet</p>
            <p className="text-xs">Search and add cards with audio above</p>
          </div>
        ) : (
          playlistItems.map((item, index) => (
            <div
              key={`${item.cardId}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-sm transition-shadow ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
              
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium flex-shrink-0">
                {index + 1}
              </div>

              {item.coverUrl ? (
                <img
                  src={item.coverUrl}
                  alt={item.title || 'Track'}
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Music className="h-4 w-4 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title || `Card ${item.cardId}`}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromPlaylist(index)}
                className="h-8 w-8 p-0 flex-shrink-0 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}