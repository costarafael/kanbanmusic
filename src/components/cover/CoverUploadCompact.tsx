"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Image } from "lucide-react";

interface CoverUploadCompactProps {
  currentUrl?: string;
  onCoverUrlChange: (url: string) => void;
  aspectRatio?: "1:1" | "16:9";
}

export function CoverUploadCompact({ currentUrl, onCoverUrlChange, aspectRatio = "1:1" }: CoverUploadCompactProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      console.log('Processing and uploading cover image...');
      
      // Use the processed upload endpoint that converts to JPG and resizes
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await fetch('/api/upload/cover-processed', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const result = await response.json();
      console.log('Cover upload successful:', result);
      
      onCoverUrlChange(result.url);
    } catch (error) {
      console.error('Error uploading cover:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload cover image';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      handleFileUpload(file);
    }
  };

  const handleRemoveCover = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onCoverUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectRatioClass = aspectRatio === "1:1" ? "aspect-square" : "aspect-video";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Cover Image</label>
      </div>
      
      {currentUrl ? (
        // When there's a cover image - show image with hover buttons
        <div className={`${aspectRatioClass} w-full bg-muted rounded border overflow-hidden relative group`}>
          <img 
            src={currentUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          {/* Hover overlay with buttons */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="bg-white/90 hover:bg-white text-black"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Change Cover
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveCover}
              className="bg-red-600/90 hover:bg-red-700 text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        // When there's no cover - show "Add Cover" button
        <div className={`${aspectRatioClass} w-full bg-muted rounded border flex items-center justify-center`}>
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="h-full w-full flex-col gap-2 text-muted-foreground hover:text-foreground"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <Image className="h-6 w-6" />
                <span className="text-sm font-medium">Add Cover</span>
              </>
            )}
          </Button>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP, GIF (max 5MB)
      </p>
    </div>
  );
}