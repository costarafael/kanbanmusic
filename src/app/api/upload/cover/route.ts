import { NextRequest } from 'next/server';
import { handleFileUpload, UPLOAD_CONFIGS } from '@/lib/utils/upload-helpers';

export async function POST(request: NextRequest) {
  return handleFileUpload(request, UPLOAD_CONFIGS.cover);
}