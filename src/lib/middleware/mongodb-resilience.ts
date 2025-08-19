import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function withMongoResilience<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Ensure fresh connection for each attempt
      await dbConnect();
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a MongoDB connection/SSL error
      const isConnectionError = 
        error.name === 'MongoServerSelectionError' ||
        error.name === 'MongoNetworkError' ||
        error.message?.includes('SSL') ||
        error.message?.includes('TLS') ||
        error.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR';

      // If it's not a connection error or we've exhausted retries, throw immediately
      if (!isConnectionError || attempt === maxRetries) {
        console.error(`MongoDB operation failed after ${attempt + 1} attempts:`, error);
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`MongoDB connection attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function handleMongoError(error: any): NextResponse {
  console.error('MongoDB Error Details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    errorLabels: error.errorLabels,
    stack: error.stack?.substring(0, 500) // Limit stack trace
  });

  // Check for specific error types
  if (error.name === 'MongoServerSelectionError') {
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        message: 'Unable to connect to database. Please try again in a moment.',
        code: 'DB_CONNECTION_ERROR'
      }, 
      { status: 503 } // Service Unavailable
    );
  }

  if (error.message?.includes('SSL') || error.message?.includes('TLS')) {
    return NextResponse.json(
      { 
        error: 'Database SSL error', 
        message: 'Secure connection to database failed. Please try again.',
        code: 'DB_SSL_ERROR'
      }, 
      { status: 503 }
    );
  }

  // Generic database error
  return NextResponse.json(
    { 
      error: 'Database operation failed', 
      message: 'An error occurred while processing your request. Please try again.',
      code: 'DB_OPERATION_ERROR'
    }, 
    { status: 500 }
  );
}