import sharp from 'sharp';

interface ImageProcessingOptions {
  maxWidth: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 600,
  quality: 85,
  format: 'jpeg'
};

export async function processImage(
  buffer: Buffer,
  options: Partial<ImageProcessingOptions> = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    let processedImage = sharp(buffer);
    
    // Resize if width is greater than maxWidth
    if (metadata.width && metadata.width > opts.maxWidth) {
      processedImage = processedImage.resize({
        width: opts.maxWidth,
        height: undefined, // Maintain aspect ratio
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Convert to specified format with quality
    switch (opts.format) {
      case 'jpeg':
        processedImage = processedImage.jpeg({ 
          quality: opts.quality,
          progressive: true,
          mozjpeg: true 
        });
        break;
      case 'png':
        processedImage = processedImage.png({ 
          compressionLevel: 9,
          progressive: true 
        });
        break;
      case 'webp':
        processedImage = processedImage.webp({ 
          quality: opts.quality 
        });
        break;
    }
    
    return await processedImage.toBuffer();
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

export function getProcessedImageExtension(format: string = 'jpeg'): string {
  switch (format) {
    case 'jpeg':
      return 'jpg';
    case 'png':
      return 'png';
    case 'webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

export function getImageMimeType(format: string = 'jpeg'): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}