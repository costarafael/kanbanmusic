"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Loader2, Image, Upload, Link } from "lucide-react";

interface CoverUploadTabsProps {
  currentUrl?: string;
  onCoverUrlChange: (url: string) => void;
  aspectRatio?: "1:1" | "16:9";
}

export function CoverUploadTabs({ currentUrl, onCoverUrlChange, aspectRatio = "1:1" }: CoverUploadTabsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || "");
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

  const handleUrlSubmit = () => {
    onCoverUrlChange(urlInput);
  };

  const handleRemoveCover = () => {
    onCoverUrlChange("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectRatioClass = aspectRatio === "1:1" ? "aspect-square" : "aspect-video";

  return (
    <div className="space-y-4">
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
      
      {currentUrl ? (
        <div className={`${aspectRatioClass} w-full bg-muted rounded border overflow-hidden`}>
          <img 
            src={currentUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`${aspectRatioClass} w-full bg-muted rounded border border-dashed`}>
          <Tabs defaultValue="file" className="w-full h-full">
            <div className="p-4">
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
            </div>
            
            <div className="px-4 pb-4">
              <TabsContent value="file" className="mt-0">
                <div className="flex flex-col items-center justify-center py-8">
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col h-auto p-6"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Image className="h-8 w-8 mb-2" />
                        <span>Choose File</span>
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    JPEG, PNG, WebP, GIF (max 5MB)
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="mt-0">
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Enter image URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  />
                  <Button onClick={handleUrlSubmit} className="w-full">
                    Set Cover Image
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}