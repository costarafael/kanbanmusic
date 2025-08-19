"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Music, Play, Pause, Square, SkipForward, SkipBack, Search, Plus, X, GripVertical } from "lucide-react";
import { useAudioStore } from "@/lib/store/useAudioStore";

interface PlaylistItem {
  cardId: string;
  order: number;
  title?: string;
  audioUrl?: string;
  coverUrl?: string;
}

interface SearchResult {
  id: string;
  title: string;
  audioUrl?: string;
  coverUrl?: string;
}

interface PlaylistPlayerProps {
  playlistItems: PlaylistItem[];
  cardId: string; // For the audio store
  onCardClick?: (cardId: string) => void; // To open referenced cards
  boardId?: string; // For generating card URLs
  onPlaylistChange?: (items: PlaylistItem[]) => void; // For updating playlist
}

export function PlaylistPlayer({ playlistItems, cardId, onCardClick, boardId, onPlaylistChange }: PlaylistPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { playing, actions } = useAudioStore();
  const playerId = 'playlist';
  const isThisPlayerPlaying = playing?.cardId === cardId && playing?.playerId === playerId;

  const currentTrack = playlistItems[currentTrackIndex];
  const hasAudio = currentTrack?.audioUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      // Auto play next track
      if (currentTrackIndex < playlistItems.length - 1) {
        setCurrentTrackIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentTrackIndex(0);
      }
    };

    const handleError = () => {
      console.error("Audio failed to load");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentTrackIndex, playlistItems.length]);

  useEffect(() => {
    if (isPlaying && hasAudio) {
      audioRef.current?.play().catch(console.error);
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex, hasAudio]);

  const handlePlay = () => {
    if (!hasAudio) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      actions.pause();
    } else {
      // Stop any other playing audio
      actions.stop();
      setIsPlaying(true);
      actions.play(cardId, playerId);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    actions.stop();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Stop this player if another one starts playing
  useEffect(() => {
    if (playing && !isThisPlayerPlaying && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [playing, isThisPlayerPlaying, isPlaying]);

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < playlistItems.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      setCurrentTime(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !hasAudio) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * (duration || 100);
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const generateCardUrl = (cardId: string) => {
    if (!boardId) return '#';
    const baseUrl = window.location.origin;
    return `${baseUrl}/b/${boardId}?card=${cardId}`;
  };

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
    if (!onPlaylistChange) return;

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
    setShowSearch(false);
  };

  const removeFromPlaylist = (index: number) => {
    if (!onPlaylistChange) return;

    const newItems = playlistItems
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }));
    onPlaylistChange(newItems);

    // Adjust current track index if needed
    if (index === currentTrackIndex) {
      setCurrentTrackIndex(0);
      setIsPlaying(false);
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (!onPlaylistChange) return;

    const newItems = [...playlistItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    // Update order
    const reorderedItems = newItems.map((item, i) => ({ ...item, order: i }));
    onPlaylistChange(reorderedItems);

    // Update current track index
    if (fromIndex === currentTrackIndex) {
      setCurrentTrackIndex(toIndex);
    } else if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    } else if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
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

  return (
    <div className={`p-3 rounded-lg space-y-3 relative overflow-hidden ${
      isThisPlayerPlaying && isPlaying 
        ? 'bg-gradient-to-r from-purple-900/80 via-blue-800/80 to-pink-800/80 animate-gradient-x' 
        : 'bg-slate-700'
    }`}>
      {hasAudio && (
        <audio ref={audioRef} src={currentTrack.audioUrl} preload="metadata" />
      )}
      
      {/* Audio Player Section - only show when tracks exist */}
      {playlistItems.length > 0 && (
        <>
          {/* Current track info */}
          <div className="flex items-center gap-3">
        {currentTrack?.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title || 'Track'}
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">
            <Music className="h-5 w-5 text-slate-300" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">
            {currentTrack?.title || `Track ${currentTrackIndex + 1}`}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {currentTrackIndex + 1} of {playlistItems.length}
            </Badge>
            {hasAudio && duration > 0 && (
              <span className="text-xs text-slate-300 font-mono">
                {formatTime(duration)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={currentTrackIndex === 0}
          className="h-8 w-8 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          disabled={!hasAudio}
          className="h-10 w-10 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          disabled={!hasAudio}
          className="h-8 w-8 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={currentTrackIndex === playlistItems.length - 1}
          className="h-8 w-8 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline - only show if current track has audio and duration > 0 */}
      {hasAudio && duration > 0 && (
        <div className="space-y-2">
          <div 
            className="w-full bg-slate-600 rounded-full h-2 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="bg-slate-100 h-full rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-300 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
        </>
      )}

      {/* Add to playlist button and search */}
      {onPlaylistChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">Playlist Management</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="h-6 px-2 text-slate-300 hover:text-slate-100"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Track
            </Button>
          </div>

          {/* Search interface */}
          {showSearch && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search cards to add..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-600 border-slate-500 text-slate-100 placeholder-slate-400 text-sm"
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="max-h-24 overflow-y-auto bg-slate-600 rounded border border-slate-500">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-500 cursor-pointer text-xs"
                      onClick={() => addToPlaylist(result)}
                    >
                      {/* Cover image */}
                      {result.coverUrl ? (
                        <img
                          src={result.coverUrl}
                          alt={result.title}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-slate-500 rounded flex items-center justify-center flex-shrink-0">
                          <Music className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                      
                      <span className="flex-1 truncate text-slate-100">{result.title}</span>
                      <Plus className="h-3 w-3 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="text-xs text-slate-400 text-center py-2">Searching...</div>
              )}

              {searchTerm && !isSearching && searchResults.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-2">No cards found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Track list with drag & drop */}
      {playlistItems.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              Tracks ({playlistItems.length})
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {playlistItems.map((track, index) => (
              <div
                key={`${track.cardId}-${index}`}
                draggable={!!onPlaylistChange}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                  index === currentTrackIndex
                    ? 'bg-slate-600 text-slate-100'
                    : 'text-slate-300 hover:bg-slate-600/50'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                {/* Drag handle */}
                {onPlaylistChange && (
                  <GripVertical className="h-3 w-3 text-slate-500 cursor-grab" />
                )}
                
                {/* Track number */}
                <span 
                  className="w-4 text-center cursor-pointer"
                  onClick={() => setCurrentTrackIndex(index)}
                >
                  {index + 1}
                </span>
                
                {/* Cover image */}
                {track.coverUrl ? (
                  <img
                    src={track.coverUrl}
                    alt={track.title || `Track ${index + 1}`}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center flex-shrink-0">
                    <Music className="h-4 w-4 text-slate-400" />
                  </div>
                )}
                
                {/* Track title */}
                <a
                  href={generateCardUrl(track.cardId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate cursor-pointer hover:text-slate-100 transition-colors hover:underline"
                  title="Click to open card in new tab"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent playlist item selection
                  }}
                >
                  {track.title || `Track ${index + 1}`}
                </a>
                
                {/* Audio status badge */}
                {!track.audioUrl && (
                  <Badge variant="outline" className="text-xs border-slate-500 text-slate-400">
                    No audio
                  </Badge>
                )}
                
                {/* Remove button */}
                {onPlaylistChange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromPlaylist(index)}
                    className="h-4 w-4 p-0 text-slate-400 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}