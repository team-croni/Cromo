import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET 요청: 메모 개수 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 각 카테고리의 메모 개수 조회
    const [recentCount, archivedCount, deletedCount, sharedCount] = await Promise.all([
      prisma.memo.count({
        where: {
          userId,
          isDeleted: false,
          isUserDeleted: false,
        },
      }),
      prisma.memo.count({
        where: {
          userId,
          isArchived: true,
          isDeleted: false,
          isUserDeleted: false,
        },
      }),
      prisma.memo.count({
        where: {
          userId,
          isDeleted: true,
          isUserDeleted: false,
        },
      }),
      prisma.userSharedMemo.count({
        where: {
          userId: userId,
          memo: {
            isDeleted: false,
            isUserDeleted: false,
            // 자신의 메모는 제외
            userId: {
              not: userId,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      recent: recentCount,
      archived: archivedCount,
      deleted: deletedCount,
      shared: sharedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching memo counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memo counts' },
      { status: 500 }
    );
  }
}