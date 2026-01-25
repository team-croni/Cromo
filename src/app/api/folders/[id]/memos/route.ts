import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@lib/auth';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: folderId } = await context.params; // params를 await하여 사용

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    const memos = await prisma.memo.findMany({
      where: {
        folderId: folderId === 'root' ? null : folderId,
        userId: session.user.id,
        isDeleted: false,
        isUserDeleted: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(memos, { status: 200 });
  } catch (error) {
    console.error('Error fetching memos by folder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memos by folder' },
      { status: 500 }
    );
  }
}