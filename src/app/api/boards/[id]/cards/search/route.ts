import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Card } from '@/lib/db/models';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id: boardId } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID not found' }, { status: 400 });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ cards: [] });
    }

    // Find cards in the board that match the search term
    // We need to find cards by getting all columns in this board first
    const cards = await Card.aggregate([
      {
        $lookup: {
          from: 'columns',
          localField: 'columnId',
          foreignField: 'id',
          as: 'column'
        }
      },
      {
        $match: {
          'column.boardId': boardId,
          status: 'active',
          isPlaylist: { $ne: true }, // Exclude playlist cards from search results
          title: { $regex: query, $options: 'i' }
        }
      },
      {
        $project: {
          _id: 0,
          id: 1,
          title: 1,
          audioUrl: 1,
          coverUrl: 1,
          isPlaylist: 1
        }
      },
      {
        $limit: 20
      }
    ]);

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json({ error: 'Failed to search cards' }, { status: 500 });
  }
}