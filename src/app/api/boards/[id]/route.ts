import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Board, Column, Card } from '@/lib/db/models';
import { NextRequest } from 'next/server';
import { updateBoardSchema } from '@/lib/validators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('GET /api/boards/[id] - Starting request');
  
  try {
    await dbConnect();
    console.log('GET /api/boards/[id] - MongoDB connected');

    const { id } = await params;
    console.log('GET /api/boards/[id] - Board ID:', id);
    
    if (!id) {
      console.log('GET /api/boards/[id] - No ID provided');
      return NextResponse.json({ error: 'Board ID not found in URL' }, { status: 400 });
    }

    const board = await Board.findOne({ id });
    console.log('GET /api/boards/[id] - Board found:', !!board);
    
    if (!board) {
      console.log('GET /api/boards/[id] - Board not found for ID:', id);
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const columns = await Column.find({ boardId: id, status: 'active' }).sort({ order: 1 });
    console.log('GET /api/boards/[id] - Columns found:', columns.length);
    
    const cards = await Card.find({ columnId: { $in: columns.map(c => c.id) }, status: 'active' }).sort({ order: 1 });
    console.log('GET /api/boards/[id] - Cards found:', cards.length);

    const response = { board, columns, cards };
    console.log('GET /api/boards/[id] - Sending response');
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/boards/[id] - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Board ID not found in URL' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateBoardSchema.parse(body);
    const updatedBoard = await Board.findOneAndUpdate({ id }, validatedData, { new: true });

    if (!updatedBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(updatedBoard);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating board:', error);
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
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
      return NextResponse.json({ error: 'Board ID not found in URL' }, { status: 400 });
    }

    // Delete all cards first
    await Card.deleteMany({ columnId: { $in: await Column.find({ boardId: id }).distinct('id') } });
    
    // Delete all columns
    await Column.deleteMany({ boardId: id });
    
    // Delete the board
    const deletedBoard = await Board.findOneAndDelete({ id });

    if (!deletedBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
