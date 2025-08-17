import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Board } from '@/lib/db/models';
import { nanoid } from 'nanoid';
import { createBoardSchema } from '@/lib/validators';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json().catch(() => ({}));
    const validatedData = createBoardSchema.parse(body);
    
    const newBoard = await Board.create({ 
      id: nanoid(),
      title: validatedData.title || 'Novo Board'
    });
    return NextResponse.json({ id: newBoard.id, title: newBoard.title });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
