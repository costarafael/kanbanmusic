import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    console.log('Health check: Attempting MongoDB connection...');
    const startTime = Date.now();
    
    await dbConnect();
    
    const endTime = Date.now();
    const connectionTime = endTime - startTime;
    
    console.log(`Health check: MongoDB connected in ${connectionTime}ms`);
    
    return NextResponse.json({ 
      status: 'healthy', 
      mongodb: 'connected',
      connectionTime: `${connectionTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({ 
      status: 'unhealthy', 
      mongodb: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}