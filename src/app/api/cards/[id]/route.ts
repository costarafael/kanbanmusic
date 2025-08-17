import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Card } from '@/lib/db/models';
import { NextRequest } from 'next/server';
import { updateCardSchema } from '@/lib/validators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Card ID not found in URL' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateCardSchema.parse(body);
    const updatedCard = await Card.findOneAndUpdate(
      { id },
      validatedData,
      { new: true }
    );

    if (!updatedCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCard);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating card:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
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
      return NextResponse.json({ error: 'Card ID not found in URL' }, { status: 400 });
    }

    const deletedCard = await Card.findOneAndDelete({ id, status: 'archived' });

    if (!deletedCard) {
      return NextResponse.json({ error: 'Card not found or not archived' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Card deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
