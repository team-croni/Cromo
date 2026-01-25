import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  getAllMemos,
  createMemo,
  getRecentlyUpdatedMemos,
  getArchivedMemos,
  getDeletedMemos,
  getSharedMemos,
  moveMemosToTrash,
  archiveMemos,
  restoreMemosFromTrash,
  permanentlyDeleteMemos,
  moveMemosToFolder
} from '@/lib/db';
import { validateCreateMemoInput, validateBatchOperationInput } from '@/lib/validation/memo-validation';
import { getSessionUser, handleApiRouteError } from '@/lib/server-utils';

const prisma = new PrismaClient();

// 메모 소유권 검증 함수
async function validateMemoOwnership(ids: string[], userId: string) {
  const memos = await prisma.memo.findMany({
    where: { id: { in: ids } },
    select: { id: true, userId: true }
  });

  if (memos.length !== ids.length) {
    throw new Error('Some memos not found');
  }

  const unauthorized = memos.filter(memo => memo.userId !== userId);
  if (unauthorized.length > 0) {
    throw new Error('Access denied to some memos');
  }
}

// GET 요청: 모든 메모 조회
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, archived, deleted

    let memos;
    switch (type) {
      case 'archived':
        memos = await getArchivedMemos(user.id);
        break;
      case 'deleted':
        memos = await getDeletedMemos(user.id);
        break;
      case 'shared':
        memos = await getSharedMemos(user.id);
        break;
      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        memos = await getRecentlyUpdatedMemos(limit, user.id);
        break;
      default:
        memos = await getAllMemos(user.id);
    }

    return NextResponse.json(memos, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error);
  }
}

// POST 요청: 새 메모 생성
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    // 입력 데이터 검증
    validateCreateMemoInput(body);

    const { title, content, folderId, tags, isArchived } = body;

    const memo = await createMemo(title, content || '', isArchived || false, folderId || null, user.id);
    // 태그가 제공되었을 경우 처리
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // 태그 처리 로직은 개별 엔드포인트에서 처리
      // 현재는 기본 생성만 수행
    }

    return NextResponse.json(memo, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error);
  }
}

// PATCH 요청: 메모 일괄 처리
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    // 입력 데이터 검증
    validateBatchOperationInput(body);

    const { ids, action } = body;

    // 메모 소유권 검증
    await validateMemoOwnership(ids, user.id);

    switch (action) {
      case 'archive':
        await archiveMemos(ids, user.id, true);
        return NextResponse.json({ message: 'Memos archived successfully' }, { status: 200 });

      case 'unarchive':
        await archiveMemos(ids, user.id, false);
        return NextResponse.json({ message: 'Memos unarchived successfully' }, { status: 200 });

      case 'trash':
        await moveMemosToTrash(ids, user.id);
        return NextResponse.json({ message: 'Memos moved to trash successfully' }, { status: 200 });

      case 'restore':
        await restoreMemosFromTrash(ids, user.id);
        return NextResponse.json({ message: 'Memos restored successfully' }, { status: 200 });

      case 'permanent-delete':
        await permanentlyDeleteMemos(ids, user.id);
        return NextResponse.json({ message: 'Memos permanently deleted successfully' }, { status: 200 });

      case 'move':
        await moveMemosToFolder(ids, body.folderId, user.id);
        return NextResponse.json({ message: 'Memos moved successfully' }, { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiRouteError(error);
  }
}