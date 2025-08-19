"use client";

import { FileUploadStatus } from "./hooks/useBulkImport";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Music, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FileListProps {
  files: FileUploadStatus[];
  onRemoveFile: (fileId: string) => void;
  isProcessing: boolean;
}

export function FileList({ files, onRemoveFile, isProcessing }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">No files selected</p>
        <p className="text-gray-400 text-xs mt-1">Choose audio files to import as cards</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {files.map((fileStatus) => (
        <FileItem
          key={fileStatus.id}
          fileStatus={fileStatus}
          onRemove={() => onRemoveFile(fileStatus.id)}
          canRemove={!isProcessing || fileStatus.status === 'pending'}
        />
      ))}
    </div>
  );
}

interface FileItemProps {
  fileStatus: FileUploadStatus;
  onRemove: () => void;
  canRemove: boolean;
}

function FileItem({ fileStatus, onRemove, canRemove }: FileItemProps) {
  const { file, title, status, progress, error } = fileStatus;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Music className="h-4 w-4 text-gray-400" />;
      case 'uploading':
      case 'extracting-cover':
      case 'creating-card':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Ready to import';
      case 'uploading':
        return 'Uploading audio...';
      case 'extracting-cover':
        return 'Extracting cover art...';
      case 'creating-card':
        return 'Creating card...';
      case 'success':
        return 'Import completed';
      case 'error':
        return error || 'Import failed';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'pending':
        return 'secondary' as const;
      case 'uploading':
      case 'extracting-cover':
      case 'creating-card':
        return 'default' as const;
      case 'success':
        return 'default' as const; // We'll style this with custom classes
      case 'error':
        return 'destructive' as const;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
      {getStatusIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">{title}</p>
          <Badge 
            variant={getStatusBadgeVariant()}
            className={status === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
          >
            {status}
          </Badge>
        </div>
        
        <p className="text-xs text-gray-500 mb-2">
          {file.name} ({formatFileSize(file.size)})
        </p>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{getStatusText()}</span>
            {status !== 'pending' && status !== 'success' && status !== 'error' && (
              <span>{progress}%</span>
            )}
          </div>
          
          {(status === 'uploading' || status === 'extracting-cover' || status === 'creating-card') && (
            <Progress value={progress} className="h-1" />
          )}
        </div>
      </div>
      
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}