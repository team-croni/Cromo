import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSharedMemos } from '@/lib/db/memo';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sharedMemos = await getSharedMemos(userId);

    return NextResponse.json(sharedMemos, { status: 200 });
  } catch (error) {
    console.error('Error fetching shared memos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}