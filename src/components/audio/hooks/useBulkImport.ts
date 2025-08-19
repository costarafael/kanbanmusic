import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface FileUploadStatus {
  file: File;
  id: string;
  title: string;
  status: 'pending' | 'uploading' | 'extracting-cover' | 'creating-card' | 'success' | 'error';
  progress: number;
  audioUrl?: string;
  coverUrl?: string;
  cardId?: string;
  error?: string;
}

export function useBulkImport() {
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const addFiles = (fileList: FileList) => {
    const newFiles: FileUploadStatus[] = Array.from(fileList).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      title: getFileNameWithoutExtension(file.name),
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const updateFileStatus = (fileId: string, updates: Partial<FileUploadStatus>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ));
  };

  const processFiles = async (columnId: string) => {
    if (files.length === 0) return;

    setIsProcessing(true);

    // Process files sequentially to avoid overwhelming the server
    for (const fileStatus of files) {
      if (fileStatus.status !== 'pending') continue;

      try {
        // Step 1: Upload audio file
        updateFileStatus(fileStatus.id, { 
          status: 'uploading', 
          progress: 20 
        });

        const audioUrl = await uploadAudioFile(fileStatus.file);
        
        updateFileStatus(fileStatus.id, { 
          audioUrl,
          progress: 50 
        });

        // Step 2: Extract cover art if MP3
        let coverUrl: string | undefined;
        if (isMP3File(fileStatus.file)) {
          updateFileStatus(fileStatus.id, { 
            status: 'extracting-cover', 
            progress: 70 
          });

          coverUrl = await extractCoverArt(fileStatus.file);
          
          if (coverUrl) {
            updateFileStatus(fileStatus.id, { 
              coverUrl,
              progress: 80 
            });
          }
        }

        // Step 3: Create card
        updateFileStatus(fileStatus.id, { 
          status: 'creating-card', 
          progress: 90 
        });

        const cardData = {
          title: fileStatus.title,
          audioUrl,
          ...(coverUrl && { coverUrl })
        };

        console.log('Creating card with data:', cardData);
        const newCard = await createCard(columnId, cardData);

        updateFileStatus(fileStatus.id, { 
          status: 'success', 
          progress: 100,
          cardId: newCard.id
        });

      } catch (error) {
        console.error('Error processing file:', fileStatus.file.name, error);
        updateFileStatus(fileStatus.id, { 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Invalidate board query to refresh UI
    queryClient.invalidateQueries({ queryKey: ["board"] });
    setIsProcessing(false);
  };

  return {
    files,
    isProcessing,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
  };
}

// Helper functions
function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? fileName : fileName.substring(0, lastDot);
}

function isMP3File(file: File): boolean {
  return file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.name.toLowerCase().endsWith('.mp3');
}

async function uploadAudioFile(file: File): Promise<string> {
  const { upload } = await import('@vercel/blob/client');
  
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload/audio-presigned',
  });
  
  return blob.url;
}

async function extractCoverArt(file: File): Promise<string | undefined> {
  try {
    // Use the same logic as useCoverExtraction
    const { parseBlob } = await import('music-metadata-browser');
    const metadata = await parseBlob(file);
    
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      const blob = new Blob([picture.data.buffer as ArrayBuffer], { type: picture.format });
      
      // Upload cover image to Vercel Blob
      const { upload } = await import('@vercel/blob/client');
      const coverBlob = await upload(`cover-${file.name}.${picture.format.split('/')[1]}`, blob, {
        access: 'public',
        handleUploadUrl: '/api/upload/cover-presigned',
      });
      
      return coverBlob.url;
    }
  } catch (error) {
    console.warn('Failed to extract cover art:', error);
  }
  
  return undefined;
}

async function createCard(columnId: string, cardData: { title: string; audioUrl: string; coverUrl?: string }) {
  console.log('Sending to API:', { columnId, cardData });
  
  const response = await fetch(`/api/columns/${columnId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardData),
  });
  
  console.log('API Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', errorText);
    throw new Error(`Failed to create card: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log('Created card:', result);
  return result;
}