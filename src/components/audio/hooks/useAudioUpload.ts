import { useState } from 'react';

export function useAudioUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (
    file: File,
    onAudioUrlChange: (url: string, aiNotes?: string) => void
  ) => {
    setIsUploading(true);
    console.log('Starting audio upload:', { name: file.name, size: file.size, type: file.type });
    
    try {
      // Check file size (maximum 100MB)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('File size must be less than 100MB');
      }
      
      let uploadedUrl: string;
      let musicAiNotes: string | undefined;
      
      // Always use client upload to avoid server limits
      console.log('Using client upload for all files...');
      
      try {
        const { upload } = await import('@vercel/blob/client');
        
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload/audio-presigned',
        });
        
        uploadedUrl = blob.url;
        console.log('Client upload successful:', blob.url);
        
        // Optional: Try AI analysis (may timeout for large files, but worth trying)
        console.log('Attempting AI analysis...');
        try {
          const formData = new FormData();
          formData.append('audio', file);
          
          const aiResponse = await fetch('/api/ai/clap-music', {
            method: 'POST',
            body: formData
          });
          
          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            if (aiResult.success && aiResult.musicNotes) {
              musicAiNotes = aiResult.musicNotes;
              console.log('AI analysis successful');
            }
          } else {
            console.log('AI analysis failed, but upload succeeded');
          }
        } catch (aiError) {
          console.log('AI analysis timed out, but upload succeeded:', aiError);
        }
        
      } catch (clientUploadError) {
        console.error('Client upload failed:', clientUploadError);
        throw new Error(`Client upload failed: ${clientUploadError instanceof Error ? clientUploadError.message : 'Unknown error'}`);
      }
      
      onAudioUrlChange(uploadedUrl, musicAiNotes);
      return { success: true, url: uploadedUrl, aiNotes: musicAiNotes };
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      
      // Check if it's a network error, permission error, etc.
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error detected - check if API endpoint is accessible');
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload audio file: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const validateAudioUrl = async (url: string): Promise<boolean> => {
    try {
      // Basic URL format validation
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        return false;
      }

      // Check if URL ends with audio file extensions
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
      const hasAudioExtension = audioExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      );

      if (!hasAudioExtension) {
        return false;
      }

      // Test if the URL actually loads as audio
      return new Promise((resolve) => {
        const audio = new Audio();
        
        const cleanup = () => {
          audio.removeEventListener('canplaythrough', onSuccess);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('abort', onError);
        };

        const onSuccess = () => {
          cleanup();
          resolve(true);
        };

        const onError = () => {
          cleanup();
          resolve(false);
        };

        audio.addEventListener('canplaythrough', onSuccess);
        audio.addEventListener('error', onError);
        audio.addEventListener('abort', onError);
        
        // Set timeout to avoid hanging
        setTimeout(() => {
          cleanup();
          resolve(false);
        }, 5000);

        audio.src = url;
        audio.load();
      });
    } catch (error) {
      console.error('Error validating audio URL:', error);
      return false;
    }
  };

  return {
    isUploading,
    handleFileUpload,
    validateAudioUrl,
  };
}