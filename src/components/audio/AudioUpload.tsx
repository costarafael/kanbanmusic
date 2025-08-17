"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";

interface AudioUploadProps {
  onAudioUrlChange: (url: string) => void;
  currentUrl?: string;
}

export function AudioUpload({ onAudioUrlChange, currentUrl }: AudioUploadProps) {
  const [audioUrl, setAudioUrl] = useState(currentUrl || "");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAudioUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      // Check if it's likely an audio file
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      const hasAudioExtension = audioExtensions.some(ext => url.toLowerCase().includes(ext));
      return hasAudioExtension || url.includes('soundcloud') || url.includes('spotify') || url.includes('youtube');
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setAudioUrl(url);
    const valid = validateAudioUrl(url);
    setIsValidUrl(valid);
    if (valid) {
      onAudioUrlChange(url);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload audio file');
      }

      const data = await response.json();
      const uploadedUrl = data.url;
      
      setAudioUrl(uploadedUrl);
      onAudioUrlChange(uploadedUrl);
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload audio file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid audio file (MP3, WAV, OGG, M4A, AAC)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      handleFileUpload(file);
    }
  };

  const handleClear = () => {
    setAudioUrl("");
    setIsValidUrl(true);
    onAudioUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Audio</label>
      
      {/* Toggle between URL and File upload */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('url')}
        >
          URL
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('file')}
        >
          Upload File
        </Button>
      </div>

      {uploadMode === 'url' ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="https://example.com/audio.mp3"
              value={audioUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={!isValidUrl ? "border-red-500" : ""}
            />
            {!isValidUrl && (
              <p className="text-sm text-red-500 mt-1">
                Please enter a valid audio URL (mp3, wav, ogg, m4a, aac) or streaming service link
              </p>
            )}
          </div>
          {audioUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
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
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Audio File
                </>
              )}
            </Button>
            {audioUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Supported formats: MP3, WAV, OGG, M4A, AAC (max 10MB)
          </p>
        </div>
      )}

      {uploadMode === 'url' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Upload className="h-4 w-4" />
          <span>Supported: Direct audio files, SoundCloud, Spotify, YouTube</span>
        </div>
      )}
    </div>
  );
}