"use client";

import { AudioUploadForm } from "./AudioUploadForm";
import { CoverExtractionDialog } from "./CoverExtractionDialog";
import { useAudioUpload } from "./hooks/useAudioUpload";
import { useCoverExtraction } from "./hooks/useCoverExtraction";
import { Music } from "lucide-react";

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
  onPlaylistItemsChange?: (items: PlaylistItem[]) => void;
}

export function AudioUploadTabs({ 
  currentUrl, 
  onAudioUrlChange, 
  currentCoverUrl, 
  onCoverUrlChange,
  isPlaylist = false,
  playlistItems = [],
  onPlaylistItemsChange
}: AudioUploadTabsProps) {
  const audioUpload = useAudioUpload();
  const coverExtraction = useCoverExtraction();

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



  return (
    <>
      {/* Content based on mode */}
      {isPlaylist ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Music className="h-4 w-4" />
            <span>This is a playlist card. Add songs using the playlist player below.</span>
          </div>
        </div>
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