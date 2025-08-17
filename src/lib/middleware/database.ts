import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function withDatabaseConnection(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await dbConnect();
    return await handler();
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }
}

export function withErrorHandling(
  handler: () => Promise<NextResponse>
) {
  return async (): Promise<NextResponse> => {
    try {
      return await handler();
    } catch (error: any) {
      console.error('API Error:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400 }
        );
      }
      
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}