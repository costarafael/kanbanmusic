import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Card } from '@/lib/db/models';
import { NextRequest } from 'next/server';
import { updateCardSchema } from '@/lib/validators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Card ID not found in URL' }, { status: 400 });
    }

    const card = await Card.findOne({ id, status: 'active' });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Populate playlist items and/or history with card data
    const cardObj = card.toObject();
    let needsPopulation = false;

    // Populate playlist items if they exist
    if (card.playlistItems && card.playlistItems.length > 0) {
      const populatedItems = [];
      
      for (const item of card.playlistItems) {
        const referencedCard = await Card.findOne({ id: item.cardId, status: 'active' });
        if (referencedCard) {
          populatedItems.push({
            cardId: item.cardId,
            order: item.order,
            title: referencedCard.title,
            audioUrl: referencedCard.audioUrl,
            coverUrl: referencedCard.coverUrl,
          });
        }
      }
      
      cardObj.playlistItems = populatedItems;
      needsPopulation = true;
    }

    // Populate playlist history if it exists
    if (card.playlistHistory && card.playlistHistory.length > 0) {
      const populatedHistory = [];
      
      for (const item of card.playlistHistory) {
        const referencedCard = await Card.findOne({ id: item.cardId, status: 'active' });
        if (referencedCard) {
          populatedHistory.push({
            cardId: item.cardId,
            order: item.order,
            title: referencedCard.title,
            audioUrl: referencedCard.audioUrl,
            coverUrl: referencedCard.coverUrl,
          });
        }
      }
      
      cardObj.playlistHistory = populatedHistory;
      needsPopulation = true;
    }

    if (needsPopulation) {
      return NextResponse.json(cardObj);
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
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
    console.error("Error:", error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
