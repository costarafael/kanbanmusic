import { nanoid } from 'nanoid';

// ID generation and validation
export const generateUniqueId = (): string => {
  return nanoid();
};

export const validateNanoId = (id: string): boolean => {
  const nanoIdRegex = /^[A-Za-z0-9_-]{21}$/;
  return nanoIdRegex.test(id);
};

// URL validation utilities
export const isValidUrl = (url: string): boolean => {
  if (!url || url === '') return true;
  
  // Allow local paths starting with /
  if (url.startsWith('/')) return true;
  
  // Allow valid URLs
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidAudioUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  if (!url) return true;
  
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const supportedServices = ['soundcloud', 'spotify', 'youtube'];
  
  const hasAudioExtension = audioExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  const isSupportedService = supportedServices.some(service => 
    url.toLowerCase().includes(service)
  );
  
  return hasAudioExtension || isSupportedService;
};

// HTML sanitization
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};