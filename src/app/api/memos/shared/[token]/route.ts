import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 공유 리스트에서 메모 제거 함수
async function removeFromSharedList(userId: string, memoId: string) {
  try {
    await prisma.userSharedMemo.deleteMany({
      where: {
        userId: userId,
        memoId: memoId,
      },
    });
  } catch (error) {
    console.error('Error removing memo from shared list:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const session = await getServerSession(authOptions);

    // 토큰으로 메모 찾기 (유효기간 확인)
    const memo = await prisma.memo.findFirst({
      where: {
        shareToken: token,
        shareExpiresAt: {
          gt: new Date(), // 현재 시간보다 이후인 것만
        },
        isDeleted: false,
        isUserDeleted: false,
      },
      include: {
        folder: true,
        tags: true,
        user: true,
      },
    });

    if (!memo) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // 현재 사용자가 메모 소유자인지 확인
    const isOwner = session?.user?.id === memo.userId;

    // 소유자가 아닌 경우에만 공유된 메모로 처리
    if (!isOwner && session?.user?.id) {
      // 사용자의 공유 리스트에 메모 추가 (중복 방지)
      await prisma.userSharedMemo.upsert({
        where: {
          userId_memoId: {
            userId: session.user.id,
            memoId: memo.id,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          memoId: memo.id,
        },
      });
    }

    return NextResponse.json({
      memo,
      isOwner,
    });
  } catch (error) {
    console.error('Error fetching shared memo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 토큰으로 메모 찾기
    const memo = await prisma.memo.findFirst({
      where: {
        shareToken: token,
        isDeleted: false,
        isUserDeleted: false,
      },
    });

    if (!memo) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // 사용자가 메모 소유자인 경우, 메모의 공유 설정을 비활성화
    if (session.user.id === memo.userId) {
      await prisma.memo.update({
        where: { id: memo.id },
        data: {
          isLiveShareEnabled: false,
          shareToken: null,
          shareExpiresAt: null,
        },
      });
    } else {
      // 다른 사용자의 경우, 사용자의 공유 리스트에서만 제거
      await removeFromSharedList(session.user.id, memo.id);
    }

    return NextResponse.json({ message: 'Memo removed from shared list' });
  } catch (error) {
    console.error('Error removing memo from shared list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

