import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from '@lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 폴더 내의 메모 개수 조회 (삭제되지 않고 보관되지 않은 메모만)
    const count = await prisma.memo.count({
      where: {
        folderId: id,
        isDeleted: false,
        isUserDeleted: false,
        isArchived: false,
      },
    });

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('Error fetching folder memo count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder memo count' },
      { status: 500 }
    );
  }
}