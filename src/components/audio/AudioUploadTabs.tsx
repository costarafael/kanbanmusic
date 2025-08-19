"use client";

import { useState } from "react";
import { AudioUploadForm } from "./AudioUploadForm";
import { CoverExtractionDialog } from "./CoverExtractionDialog";
import { useAudioUpload } from "./hooks/useAudioUpload";
import { useCoverExtraction } from "./hooks/useCoverExtraction";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Music, List } from "lucide-react";

interface PlaylistItem {
  cardId: string;
  order: number;
  title?: string;
  audioUrl?: string;
  coverUrl?: string;
}

interface AudioUploadTabsProps {
  currentUrl?: string;
  onAudioUrlChange: (url: string, aiNotes?: string) => void;
  currentCoverUrl?: string;
  onCoverUrlChange?: (url: string) => void;
  // Playlist props
  isPlaylist?: boolean;
  playlistItems?: PlaylistItem[];
  onPlaylistChange?: (isPlaylist: boolean) => void;
  onPlaylistItemsChange?: (items: PlaylistItem[]) => void;
  boardId?: string;
}

export function AudioUploadTabs({ 
  currentUrl, 
  onAudioUrlChange, 
  currentCoverUrl, 
  onCoverUrlChange,
  isPlaylist = false,
  playlistItems = [],
  onPlaylistChange,
  onPlaylistItemsChange,
  boardId
}: AudioUploadTabsProps) {
  const audioUpload = useAudioUpload();
  const coverExtraction = useCoverExtraction();
  const [localIsPlaylist, setLocalIsPlaylist] = useState(isPlaylist);

  const handleFileUpload = async (file: File) => {
    try {
      await audioUpload.handleFileUpload(file, onAudioUrlChange);
      
      // Check if MP3 has embedded cover art
      if ((file.type === 'audio/mpeg' || file.type === 'audio/mp3') && onCoverUrlChange) {
        await coverExtraction.checkForCoverArt(file, currentCoverUrl, onCoverUrlChange);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload audio file: ${errorMessage}`);
    }
  };


  const handleRemoveAudio = () => {
    onAudioUrlChange("");
  };

  const handleUseCover = async () => {
    if (onCoverUrlChange) {
      await coverExtraction.handleUseCover(onCoverUrlChange);
    }
  };

  const handleKeepCurrentCover = () => {
    coverExtraction.handleKeepCurrentCover();
  };

  const handlePlaylistToggle = (checked: boolean) => {
    setLocalIsPlaylist(checked);
    onPlaylistChange?.(checked);
    
    // Clear audio URL when switching to playlist mode
    if (checked && currentUrl) {
      handleRemoveAudio();
    }
    
    // Clear playlist when switching to audio mode
    if (!checked && playlistItems.length > 0) {
      onPlaylistItemsChange?.([]);
    }
  };

  const handlePlaylistItemsChange = (items: PlaylistItem[]) => {
    onPlaylistItemsChange?.(items);
  };

  return (
    <>
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Music className="h-4 w-4 text-gray-500" />
          <Label htmlFor="playlist-mode" className="text-sm font-medium">
            Audio Mode
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="playlist-mode" className="text-xs text-gray-500">
            Single
          </Label>
          <Switch
            id="playlist-mode"
            checked={localIsPlaylist}
            onCheckedChange={handlePlaylistToggle}
          />
          <Label htmlFor="playlist-mode" className="text-xs text-gray-500 flex items-center gap-1">
            <List className="h-3 w-3" />
            Playlist
          </Label>
        </div>
      </div>

      {/* Content based on mode */}
      {localIsPlaylist ? (
        <div className="h-4"></div>
      ) : (
        <AudioUploadForm
          currentUrl={currentUrl}
          isUploading={audioUpload.isUploading}
          onFileUpload={handleFileUpload}
          onRemoveAudio={handleRemoveAudio}
        />
      )}
      
      <CoverExtractionDialog
        isOpen={coverExtraction.showCoverDialog}
        onOpenChange={coverExtraction.setShowCoverDialog}
        extractedCoverUrl={coverExtraction.extractedCoverUrl}
        onUseCover={handleUseCover}
        onKeepCurrent={handleKeepCurrentCover}
      />
    </>
  );
}