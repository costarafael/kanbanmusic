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
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload cover image');
      }

      const data = await response.json();
      const uploadedUrl = data.url;
      
      onCoverUrlChange(uploadedUrl);
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert('Failed to upload cover image');
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
        {currentUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveCover}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
      
      {currentUrl && (
        <div className={`${aspectRatioClass} w-full bg-muted rounded border overflow-hidden mb-3`}>
          <img 
            src={currentUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
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
              <Image className="h-4 w-4 mr-2" />
              {currentUrl ? 'Change Cover' : 'Choose Cover'}
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP, GIF (max 5MB)
      </p>
    </div>
  );
}