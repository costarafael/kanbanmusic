"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CoverExtractionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  extractedCoverUrl: string;
  onUseCover: () => void;
  onKeepCurrent: () => void;
}

export function CoverExtractionDialog({
  isOpen,
  onOpenChange,
  extractedCoverUrl,
  onUseCover,
  onKeepCurrent,
}: CoverExtractionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              onClick={onKeepCurrent}
              className="flex-1"
            >
              Keep Current
            </Button>
            <Button 
              onClick={onUseCover}
              className="flex-1"
            >
              Use This Cover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}