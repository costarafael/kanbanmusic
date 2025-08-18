"use client";

import { AudioUploadForm } from "./AudioUploadForm";
import { CoverExtractionDialog } from "./CoverExtractionDialog";
import { useAudioUpload } from "./hooks/useAudioUpload";
import { useCoverExtraction } from "./hooks/useCoverExtraction";

interface AudioUploadTabsProps {
  currentUrl?: string;
  onAudioUrlChange: (url: string, aiNotes?: string) => void;
  currentCoverUrl?: string;
  onCoverUrlChange?: (url: string) => void;
}

export function AudioUploadTabs({ 
  currentUrl, 
  onAudioUrlChange, 
  currentCoverUrl, 
  onCoverUrlChange 
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

  const handleUrlSubmit = async (url: string) => {
    try {
      const isValid = await audioUpload.validateAudioUrl(url);
      
      if (!isValid) {
        alert('Invalid audio URL. Please provide a direct link to an audio file (.mp3, .wav, .ogg, .m4a, .aac, .flac)');
        return;
      }

      onAudioUrlChange(url);
    } catch (error) {
      console.error('Error validating URL:', error);
      alert('Failed to validate audio URL. Please check the URL and try again.');
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
      <AudioUploadForm
        currentUrl={currentUrl}
        isUploading={audioUpload.isUploading}
        onFileUpload={handleFileUpload}
        onUrlSubmit={handleUrlSubmit}
        onRemoveAudio={handleRemoveAudio}
      />
      
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