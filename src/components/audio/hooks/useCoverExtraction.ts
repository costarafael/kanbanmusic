import { useState } from 'react';
import { parseBuffer } from 'music-metadata-browser';

export function useCoverExtraction() {
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [extractedCoverUrl, setExtractedCoverUrl] = useState<string>("");

  const checkForCoverArt = async (
    file: File,
    currentCoverUrl?: string,
    onCoverUrlChange?: (url: string) => void
  ) => {
    try {
      console.log('Checking for embedded cover art in MP3...');
      
      const arrayBuffer = await file.arrayBuffer();
      const metadata = await parseBuffer(new Uint8Array(arrayBuffer));
      
      if (metadata.common?.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0];
        const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
        const coverUrl = URL.createObjectURL(blob);
        
        console.log('Found embedded cover art in MP3');
        setExtractedCoverUrl(coverUrl);
        
        // If card already has cover, ask user if they want to replace
        if (currentCoverUrl && onCoverUrlChange) {
          setShowCoverDialog(true);
        } else if (onCoverUrlChange) {
          // No existing cover, set directly
          await uploadExtractedCover(blob, onCoverUrlChange);
        }
      } else {
        console.log('No embedded cover art found in MP3');
      }
    } catch (error) {
      console.error('Error checking cover art:', error);
    }
  };
  
  const uploadExtractedCover = async (
    blob: Blob,
    onCoverUrlChange: (url: string) => void
  ) => {
    try {
      // Use Vercel Blob client upload for cover
      const { upload } = await import('@vercel/blob/client');
      
      const uploadedBlob = await upload('extracted-cover.jpg', blob, {
        access: 'public',
        handleUploadUrl: '/api/upload/cover-presigned',
      });

      onCoverUrlChange(uploadedBlob.url);
      console.log('Successfully uploaded extracted cover art');
    } catch (error) {
      console.error('Error uploading extracted cover:', error);
    }
  };
  
  const handleUseCover = async (onCoverUrlChange: (url: string) => void) => {
    if (extractedCoverUrl) {
      const response = await fetch(extractedCoverUrl);
      const blob = await response.blob();
      await uploadExtractedCover(blob, onCoverUrlChange);
    }
    setShowCoverDialog(false);
    URL.revokeObjectURL(extractedCoverUrl);
    setExtractedCoverUrl("");
  };
  
  const handleKeepCurrentCover = () => {
    setShowCoverDialog(false);
    URL.revokeObjectURL(extractedCoverUrl);
    setExtractedCoverUrl("");
  };

  return {
    showCoverDialog,
    setShowCoverDialog,
    extractedCoverUrl,
    checkForCoverArt,
    handleUseCover,
    handleKeepCurrentCover,
  };
}