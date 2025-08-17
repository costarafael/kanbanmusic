import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
 
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        clientPayload: string | null,
      ) => {
        // ⚠️ Beware: The payload can be tampered with by the client
        // Always validate the payload server-side.
        
        // You can validate the pathname and clientPayload here
        console.log('pathname', pathname);
        console.log('clientPayload', clientPayload);
        
        return {
          allowedContentTypes: [
            'audio/mp3', 
            'audio/wav', 
            'audio/ogg', 
            'audio/m4a', 
            'audio/aac', 
            'audio/mpeg'
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow locally
        console.log('Upload completed', blob, tokenPayload);
        
        try {
          // Here you could store the blob URL in your database
          // await db.update({ audioUrl: blob.url });
        } catch (error) {
          throw new Error('Could not update database');
        }
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Audio presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 400 }
    );
  }
}