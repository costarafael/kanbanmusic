"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Loader2, Music, Upload, Link, AlertCircle } from "lucide-react";

interface AudioUploadFormProps {
  currentUrl?: string;
  isUploading: boolean;
  onFileUpload: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  onRemoveAudio: () => void;
}

export function AudioUploadForm({
  currentUrl,
  isUploading,
  onFileUpload,
  onUrlSubmit,
  onRemoveAudio,
}: AudioUploadFormProps) {
  const [urlInput, setUrlInput] = useState(currentUrl || "");
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

  const handleUrlSubmitInternal = () => {
    if (!urlInput.trim()) {
      alert('Please enter a URL');
      return;
    }
    onUrlSubmit(urlInput);
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
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmitInternal()}
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
              onClick={handleUrlSubmitInternal} 
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
    </div>
  );
}