import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Column, Card } from '@/lib/db/models';

export async function GET() {
  await dbConnect();

  try {
    const columns = await Column.find({ status: 'archived' });
    const cards = await Card.find({ status: 'archived' });

    return NextResponse.json({ columns, cards });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch archived items' }, { status: 500 });
  }
}
