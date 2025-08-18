"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Music } from "lucide-react";

interface AudioUploadFormProps {
  currentUrl?: string;
  isUploading: boolean;
  onFileUpload: (file: File) => void;
  onRemoveAudio: () => void;
}

export function AudioUploadForm({
  currentUrl,
  isUploading,
  onFileUpload,
  onRemoveAudio,
}: AudioUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      onFileUpload(file);
    }
  };


  if (currentUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Audio</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemoveAudio}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
        
        <div className="p-4 bg-muted rounded border">
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm truncate flex-1">{currentUrl}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Audio</label>
      </div>
      
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
    </div>
  );
}