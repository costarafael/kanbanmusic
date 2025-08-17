import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Board } from '@/lib/db/models';
import { nanoid } from 'nanoid';
import { createBoardSchema } from '@/lib/validators';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('POST /api/boards - Starting board creation');
  
  try {
    await dbConnect();
    console.log('POST /api/boards - MongoDB connected');

    const body = await request.json().catch(() => ({}));
    console.log('POST /api/boards - Request body:', body);
    
    const validatedData = createBoardSchema.parse(body);
    console.log('POST /api/boards - Validated data:', validatedData);
    
    const boardId = nanoid();
    const newBoard = await Board.create({ 
      id: boardId,
      title: validatedData.title || 'Novo Board'
    });
    
    console.log('POST /api/boards - Board created:', { id: newBoard.id, title: newBoard.title });
    return NextResponse.json({ id: newBoard.id, title: newBoard.title });
  } catch (error: any) {
    console.error('POST /api/boards - Error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
