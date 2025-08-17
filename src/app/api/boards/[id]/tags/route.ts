import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Board } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    
    const board = await Board.findOne({ 
      id: id,
      $or: [{ status: 'active' }, { status: { $exists: false } }]
    });
    
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      tags: board.knownTags || [] 
    });
    
  } catch (error) {
    console.error('Error fetching board tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    
    const { tags } = await request.json();
    
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 });
    }
    
    // Find the board
    const board = await Board.findOne({ 
      id: id,
      $or: [{ status: 'active' }, { status: { $exists: false } }]
    });
    
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }
    
    // Merge new tags with existing ones (remove duplicates)
    const existingTags = board.knownTags || [];
    const newTags = tags.filter(tag => tag && typeof tag === 'string' && tag.trim());
    const uniqueTags = [...new Set([...existingTags, ...newTags])];
    
    // Update board with new tags
    await Board.findOneAndUpdate(
      { id: id },
      { knownTags: uniqueTags },
      { new: true }
    );
    
    return NextResponse.json({ 
      tags: uniqueTags 
    });
    
  } catch (error) {
    console.error('Error updating board tags:', error);
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}