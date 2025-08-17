import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Column } from '@/lib/db/models';
import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { createColumnSchema } from '@/lib/validators';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const body = await request.json();
    const validatedData = createColumnSchema.parse(body);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Board ID not found in URL' }, { status: 400 });
    }

    const newColumn = await Column.create({ 
      id: nanoid(), 
      title: validatedData.title, 
      boardId: id, 
      order: await Column.countDocuments({ boardId: id, status: 'active' }) 
    });
    return NextResponse.json(newColumn);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating column:', error);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
