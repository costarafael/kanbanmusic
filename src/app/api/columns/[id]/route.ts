import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Column, Card } from '@/lib/db/models';
import { NextRequest } from 'next/server';
import { updateColumnSchema } from '@/lib/validators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Column ID not found in URL' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateColumnSchema.parse(body);
    
    // If archiving a column, also archive its cards
    if (validatedData.status === 'archived') {
      await Card.updateMany(
        { columnId: id, status: 'active' },
        { status: 'archived' }
      );
    }

    const updatedColumn = await Column.findOneAndUpdate(
      { id },
      validatedData,
      { new: true }
    );

    if (!updatedColumn) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    return NextResponse.json(updatedColumn);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating column:', error);
    return NextResponse.json({ error: 'Failed to update column' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Column ID not found in URL' }, { status: 400 });
    }

    const deletedColumn = await Column.findOneAndDelete({ id, status: 'archived' });

    if (!deletedColumn) {
      return NextResponse.json({ error: 'Column not found or not archived' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Column deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete column' }, { status: 500 });
  }
}
