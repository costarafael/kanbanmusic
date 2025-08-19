"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileList } from "./FileList";
import { useBulkImport } from "./hooks/useBulkImport";
import { Upload, X } from "lucide-react";
import { useRef } from "react";

interface BulkImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  columnTitle: string;
}

export function BulkImportDialog({ 
  isOpen, 
  onOpenChange, 
  columnId, 
  columnTitle 
}: BulkImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, isProcessing, addFiles, removeFile, clearFiles, processFiles } = useBulkImport();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      // Validate files
      const validFiles: File[] = [];
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
      
      Array.from(fileList).forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          alert(`File "${file.name}" is not a supported audio format`);
          return;
        }
        
        if (file.size > 100 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds the 100MB limit`);
          return;
        }
        
        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        const fileList = new DataTransfer();
        validFiles.forEach(file => fileList.items.add(file));
        addFiles(fileList.files);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (files.length === 0) return;
    
    try {
      await processFiles(columnId);
    } catch (error) {
      console.error('Bulk import failed:', error);
      alert('Import process failed. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      clearFiles();
      onOpenChange(false);
    }
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const completedFiles = files.filter(f => f.status === 'success');
  const errorFiles = files.filter(f => f.status === 'error');
  const processingFiles = files.filter(f => 
    f.status === 'uploading' || 
    f.status === 'extracting-cover' || 
    f.status === 'creating-card'
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Audio Files
          </DialogTitle>
          <DialogDescription>
            Import multiple audio files to create cards in &quot;{columnTitle}&quot;. 
            Each file will become a new card with the filename as the title.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* File selection area */}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              variant="outline"
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Audio Files
            </Button>
            
            {files.length > 0 && !isProcessing && (
              <Button
                onClick={clearFiles}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Status summary */}
          {files.length > 0 && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total: {files.length}</span>
              {pendingFiles.length > 0 && <span>Pending: {pendingFiles.length}</span>}
              {processingFiles.length > 0 && <span>Processing: {processingFiles.length}</span>}
              {completedFiles.length > 0 && <span className="text-green-600">Completed: {completedFiles.length}</span>}
              {errorFiles.length > 0 && <span className="text-red-600">Errors: {errorFiles.length}</span>}
            </div>
          )}

          {/* File list */}
          <div className="flex-1 overflow-hidden">
            <FileList 
              files={files} 
              onRemoveFile={removeFile}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {isProcessing ? (
              <span>Processing files... Please wait.</span>
            ) : (
              <span>MP3, WAV, OGG, M4A, AAC (max 100MB each)</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Close'}
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={pendingFiles.length === 0 || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Importing...' : `Import ${pendingFiles.length} Files`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}