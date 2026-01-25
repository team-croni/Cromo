import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: memoId } = await params;

    // 메모가 존재하고 사용자의 것인지 확인
    const memo = await prisma.memo.findFirst({
      where: {
        id: memoId,
        userId: session.user.id,
        isDeleted: false,
        isUserDeleted: false,
      },
    });

    if (!memo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    // 토큰 생성 (32바이트 랜덤 문자열)
    const token = randomBytes(32).toString('hex');

    // 유효기간 설정 (7일)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 메모에 토큰과 만료시간 업데이트
    await prisma.memo.update({
      where: { id: memoId },
      data: {
        shareToken: token,
        shareExpiresAt: expiresAt,
      },
    });

    // 공유 링크 생성
    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/${token}`;

    return NextResponse.json({
      shareUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating share token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: memoId } = await params;

    // 메모가 존재하고 사용자의 것인지 확인
    const memo = await prisma.memo.findFirst({
      where: {
        id: memoId,
        userId: session.user.id,
        isDeleted: false,
        isUserDeleted: false,
      },
    });

    if (!memo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    // 공유 토큰 제거
    await prisma.memo.update({
      where: { id: memoId },
      data: {
        shareToken: null,
        shareExpiresAt: null,
      },
    });

    return NextResponse.json({ message: 'Share token removed' });
  } catch (error) {
    console.error('Error removing share token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}