import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Card } from '@/lib/db/models';
import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { createCardSchema } from '@/lib/validators';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const body = await request.json();
    const validatedData = createCardSchema.parse(body);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Column ID not found in URL' }, { status: 400 });
    }

    const newCard = await Card.create({ 
      id: nanoid(), 
      title: validatedData.title, 
      columnId: id, 
      order: await Card.countDocuments({ columnId: id, status: 'active' }),
      ...(validatedData.audioUrl && { audioUrl: validatedData.audioUrl }),
      ...(validatedData.coverUrl && { coverUrl: validatedData.coverUrl }),
      ...(validatedData.music_ai_notes && { music_ai_notes: validatedData.music_ai_notes }),
    });
    return NextResponse.json(newCard);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
