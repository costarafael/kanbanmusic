"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Loader2, Music, Upload, Link, AlertCircle } from "lucide-react";
import { parseBuffer } from "music-metadata-browser";

interface AudioUploadTabsProps {
  currentUrl?: string;
  onAudioUrlChange: (url: string, aiNotes?: string) => void;
  currentCoverUrl?: string;
  onCoverUrlChange?: (url: string) => void;
}

export function AudioUploadTabs({ currentUrl, onAudioUrlChange, currentCoverUrl, onCoverUrlChange }: AudioUploadTabsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || "");
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [extractedCoverUrl, setExtractedCoverUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    console.log('Starting audio upload:', { name: file.name, size: file.size, type: file.type });
    
    try {
      // Check file size (maximum 100MB)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('File size must be less than 100MB');
      }
      
      // Use new audio upload API that includes AI analysis
      const formData = new FormData();
      formData.append('audio', file);
      
      console.log('Uploading file with AI analysis...');
      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload failed:', response.status, response.statusText, errorData);
        throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
      
      onAudioUrlChange(result.url, result.music_ai_notes);
      
      // Check if MP3 has embedded cover art
      if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') {
        await checkForCoverArt(file);
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload audio file: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const checkForCoverArt = async (file: File) => {
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
          await uploadExtractedCover(blob);
        }
      } else {
        console.log('No embedded cover art found in MP3');
      }
    } catch (error) {
      console.error('Error checking cover art:', error);
    }
  };
  
  const uploadExtractedCover = async (blob: Blob) => {
    try {
      // Use Vercel Blob client upload for cover
      const { upload } = await import('@vercel/blob/client');
      
      const uploadedBlob = await upload('extracted-cover.jpg', blob, {
        access: 'public',
        handleUploadUrl: '/api/upload/cover-presigned',
      });

      if (onCoverUrlChange) {
        onCoverUrlChange(uploadedBlob.url);
      }
      console.log('Successfully uploaded extracted cover art');
    } catch (error) {
      console.error('Error uploading extracted cover:', error);
    }
  };
  
  const handleUseCover = async () => {
    if (extractedCoverUrl) {
      const response = await fetch(extractedCoverUrl);
      const blob = await response.blob();
      await uploadExtractedCover(blob);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid audio file (MP3, WAV, OGG, M4A, AAC)');
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB');
        return;
      }
      
      handleFileUpload(file);
    }
  };

  const validateAudioUrl = async (url: string): Promise<boolean> => {
    try {
      // Basic URL format validation
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        return false;
      }

      // Check if URL ends with audio file extensions
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
      const hasAudioExtension = audioExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      );

      if (!hasAudioExtension) {
        return false;
      }

      // Test if the URL actually loads as audio
      return new Promise((resolve) => {
        const audio = new Audio();
        
        const cleanup = () => {
          audio.removeEventListener('canplaythrough', onSuccess);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('abort', onError);
        };

        const onSuccess = () => {
          cleanup();
          resolve(true);
        };

        const onError = () => {
          cleanup();
          resolve(false);
        };

        audio.addEventListener('canplaythrough', onSuccess);
        audio.addEventListener('error', onError);
        audio.addEventListener('abort', onError);
        
        // Set timeout to avoid hanging
        setTimeout(() => {
          cleanup();
          resolve(false);
        }, 5000);

        audio.src = url;
        audio.load();
      });
    } catch (error) {
      console.error('Error validating audio URL:', error);
      return false;
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a URL');
      return;
    }

    setIsUploading(true);
    
    try {
      const isValid = await validateAudioUrl(urlInput);
      
      if (!isValid) {
        alert('Invalid audio URL. Please provide a direct link to an audio file (.mp3, .wav, .ogg, .m4a, .aac, .flac)');
        return;
      }

      onAudioUrlChange(urlInput);
    } catch (error) {
      console.error('Error validating URL:', error);
      alert('Failed to validate audio URL. Please check the URL and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAudio = () => {
    onAudioUrlChange("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Audio</label>
        {currentUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveAudio}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
      
      {currentUrl ? (
        <div className="p-4 bg-muted rounded border">
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm truncate flex-1">{currentUrl}</span>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              From URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4 mr-2" />
                    Choose Audio File
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                MP3, WAV, OGG, M4A, AAC (max 100MB)
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter direct audio file URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                />
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">Direct audio file links only</p>
                    <p>Please use direct links to audio files (.mp3, .wav, etc.). Streaming service links (Spotify, YouTube, etc.) are not supported.</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleUrlSubmit} 
                className="w-full"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Set Audio URL'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      <Dialog open={showCoverDialog} onOpenChange={setShowCoverDialog}>
        <DialogContent className="max-w-md" aria-describedby="cover-art-description">
          <DialogHeader>
            <DialogTitle>Cover Art Found</DialogTitle>
            <DialogDescription id="cover-art-description">
              This MP3 file contains embedded cover art. Would you like to use it as the card&apos;s cover image?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {extractedCoverUrl && (
              <div className="aspect-square w-32 mx-auto bg-muted rounded border overflow-hidden">
                <img 
                  src={extractedCoverUrl} 
                  alt="Extracted cover" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleKeepCurrentCover}
                className="flex-1"
              >
                Keep Current
              </Button>
              <Button 
                onClick={handleUseCover}
                className="flex-1"
              >
                Use This Cover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}