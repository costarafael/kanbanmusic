"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Image, Check } from "lucide-react";

interface InlineCoverEditorProps {
  currentUrl?: string;
  onCoverUrlChange: (url: string) => void;
  onClose: () => void;
}

export function InlineCoverEditor({ currentUrl, onCoverUrlChange, onClose }: InlineCoverEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Use Vercel Blob client upload for large files
      const { upload } = await import('@vercel/blob/client');
      
      console.log('Uploading cover via Vercel Blob...');
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/cover-presigned',
      });
      
      console.log('Cover upload successful:', blob);
      onCoverUrlChange(blob.url);
      
      // Auto close after successful upload
      setTimeout(() => {
        onClose();
      }, 500);
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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, GIF)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      handleFileUpload(file);
    }
  };

  const handleRemoveCover = () => {
    onCoverUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-white border rounded-lg shadow-lg p-4 mx-2 mt-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Edit Cover</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {currentUrl && (
          <div className="aspect-square w-full bg-muted rounded border overflow-hidden">
            <img 
              src={currentUrl} 
              alt="Current cover" 
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
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Image className="h-3 w-3 mr-2" />
                {currentUrl ? 'Change' : 'Upload'}
              </>
            )}
          </Button>
          
          {currentUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveCover}
              disabled={isUploading}
            >
              <X className="h-3 w-3 mr-2" />
              Remove
            </Button>
          )}
          
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
          >
            <Check className="h-3 w-3 mr-2" />
            Done
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          JPEG, PNG, WebP, GIF (max 5MB)
        </p>
      </div>
    </div>
  );
}