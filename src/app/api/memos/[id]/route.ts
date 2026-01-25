import { NextResponse } from 'next/server';
import {
  getMemoById,
  getMemoByIdWithSharedAccess,
  updateMemo,
  archiveMemo,
  moveMemoToTrash,
  restoreMemoFromTrash,
  permanentlyDeleteMemo,
  addTagToMemo,
  removeTagFromMemo,
  updateLiveShareSettings
} from '@lib/db';

import { getSessionUser, handleApiRouteError, ApiError } from '@lib/server-utils';
import { validateUpdateMemoInput } from '@lib/validation/memo-validation';

// GET 요청: 특정 메모 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ID 유효성 검증
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid memo ID' }, { status: 400 });
    }

    // 세션 가져오기 (선택적)
    let userId: string | undefined;
    try {
      const user = await getSessionUser();
      userId = user.id;
    } catch (e) {
      // 인증되지 않은 사용자도 허용
    }

    // 공유된 메모 접근을 포함한 메모 조회
    const memo = await getMemoByIdWithSharedAccess(id, userId);

    // 공유 토큰으로 접근한 경우 사용자의 공유 리스트에 추가
    if (memo.shareToken && id === memo.shareToken && userId && memo.userId !== userId) {
      try {
        const { prisma } = await import('@/lib/db');
        await prisma.userSharedMemo.upsert({
          where: {
            userId_memoId: {
              userId: userId,
              memoId: memo.id,
            },
          },
          update: {},
          create: {
            userId: userId,
            memoId: memo.id,
          },
        });
      } catch (error) {
        console.error('Error adding memo to shared list:', error);
        // 공유 리스트 추가 실패는 메모 조회를 실패시키지 않음
      }
    }

    return NextResponse.json(memo, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error);
  }
}

// PUT 요청: 메모 업데이트
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;

    // ID 유효성 검증
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid memo ID' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    validateUpdateMemoInput(body);

    const { title, content, folderId, isArchived, tags } = body;

    // 먼저 현재 메모를 가져와서 Live Share 상태와 소유자 정보 확인
    const currentMemo = await getMemoByIdWithSharedAccess(id, user.id);
    const isOwner = currentMemo?.userId === user.id;

    if (!currentMemo) {
      return NextResponse.json({ error: 'Memo not found or access denied' }, { status: 404 });
    }

    // 보관 상태 변경 요청이 있는 경우
    if (typeof isArchived === 'boolean') {
      // 소유자가 아닌 경우 Live Share 권한 확인
      if (!isOwner) {
        if (!currentMemo.isLiveShareEnabled) {
          throw new ApiError('Access denied: Memo is not shared for editing', 403);
        }

        // Live Share 모드에 따라 접근 제어
        if (currentMemo.liveShareMode === "private") {
          if (!currentMemo.allowedUsers.includes(user.id)) {
            throw new ApiError('Access denied: Not in allowed users list', 403);
          }
        }

        // 쓰기 권한 확인
        if (currentMemo.liveSharePermission !== "readWrite") {
          throw new ApiError('Access denied: Read-only permission', 403);
        }
      }

      const memo = await archiveMemo(id, currentMemo.userId!, isArchived);
      return NextResponse.json(memo, { status: 200 });
    }

    // folderId만 업데이트하는 경우 title 검증 우회
    const isFolderOnlyUpdate = folderId !== undefined && title === undefined && content === undefined;

    // 일반 업데이트의 경우 title이 필요함 (folderId만 업데이트하는 경우는 제외)
    if (!title && !isFolderOnlyUpdate) {
      return NextResponse.json(
        { error: 'Title is required for memo update' },
        { status: 400 }
      );
    }

    // 소유자가 아닌 경우 Live Share 권한 확인
    if (!isOwner) {
      if (!currentMemo.isLiveShareEnabled) {
        throw new ApiError('Access denied: Memo is not shared for editing', 403);
      }

      // Live Share 모드에 따라 접근 제어
      if (currentMemo.liveShareMode === "private") {
        // 허용된 사용자만 접근 가능
        if (!currentMemo.allowedUsers.includes(user.id)) {
          throw new ApiError('Access denied: Not in allowed users list', 403);
        }
      }
      // public 모드인 경우 모든 사용자 접근 가능

      // 쓰기 권한 확인
      if (currentMemo.liveSharePermission !== "readWrite") {
        throw new ApiError('Access denied: Read-only permission', 403);
      }
    }

    const memo = await updateMemo(
      id,
      currentMemo.userId!,
      title ? title.trim() : currentMemo.title,
      content !== undefined ? content : currentMemo.content,
      folderId !== undefined ? folderId : currentMemo.folderId
    );
    return NextResponse.json(memo, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error);
  }
}

// DELETE 요청: 메모 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;

    // ID 유효성 검증
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid memo ID' }, { status: 400 });
    }

    // 메모 소유권 확인
    const currentMemo = await getMemoById(id, user.id);
    if (!currentMemo) {
      return NextResponse.json({ error: 'Memo not found or access denied' }, { status: 404 });
    }

    // 쿼리 파라미터 확인 및 유효성 검증
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // trash, permanent

    if (action && !['trash', 'permanent'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    switch (action) {
      case 'trash':
        // 휴지통으로 이동
        const trashedMemo = await moveMemoToTrash(id, user.id);
        return NextResponse.json(trashedMemo, { status: 200 });
      case 'permanent':
        // 영구 삭제
        await permanentlyDeleteMemo(id, user.id);
        return NextResponse.json({ message: 'Memo permanently deleted' }, { status: 200 });
      default:
        // 기본 삭제 동작 (휴지통으로 이동)
        const memo = await moveMemoToTrash(id, user.id);
        return NextResponse.json(memo, { status: 200 });
    }
  } catch (error) {
    return handleApiRouteError(error);
  }
}

// PATCH 요청: 메모 부분 업데이트
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;

    // ID 유효성 검증
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid memo ID' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 입력 데이터 검증 (validateUpdateMemoInput 사용)
    validateUpdateMemoInput(body);

    const {
      title,
      content,
      folderId,
      isArchived,
      tags,
      action,
      isLiveShareEnabled,
      liveShareMode,
      allowedUsers,
      liveSharePermission
    } = body;

    // 먼저 현재 메모를 가져와서 Live Share 상태와 소유자 정보 확인
    const currentMemo = await getMemoByIdWithSharedAccess(id, user.id);
    const isOwner = currentMemo?.userId === user.id;

    if (!currentMemo) {
      return NextResponse.json({ error: 'Memo not found or access denied' }, { status: 404 });
    }

    // Live Share 설정 업데이트
    if (isLiveShareEnabled !== undefined || liveShareMode !== undefined || allowedUsers !== undefined || liveSharePermission !== undefined) {
      // 메모 소유자만 Live Share 설정을 변경할 수 있음 (이미 getMemoById로 확인됨)

      const updatedMemo = await updateLiveShareSettings(
        id,
        user.id,
        isLiveShareEnabled ?? currentMemo.isLiveShareEnabled,
        liveShareMode ?? currentMemo.liveShareMode,
        allowedUsers ?? currentMemo.allowedUsers,
        liveSharePermission ?? currentMemo.liveSharePermission
      );

      return NextResponse.json(updatedMemo, { status: 200 });
    }

    // 일반 업데이트의 경우 title이 필요함
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { error: 'Title cannot be empty when provided' },
        { status: 400 }
      );
    }

    // 보관 상태 변경 요청이 있는 경우
    if (typeof isArchived === 'boolean') {
      // 소유자가 아닌 경우 Live Share 권한 확인
      if (!isOwner) {
        if (!currentMemo.isLiveShareEnabled) {
          throw new ApiError('Access denied: Memo is not shared for editing', 403);
        }

        // Live Share 모드에 따라 접근 제어
        if (currentMemo.liveShareMode === "private") {
          if (!currentMemo.allowedUsers.includes(user.id)) {
            throw new ApiError('Access denied: Not in allowed users list', 403);
          }
        }

        // 쓰기 권한 확인
        if (currentMemo.liveSharePermission !== "readWrite") {
          throw new ApiError('Access denied: Read-only permission', 403);
        }
      }

      const memo = await archiveMemo(id, user.id, isArchived);
      return NextResponse.json(memo, { status: 200 });
    }

    // 복원 액션 처리
    if (action === 'restore') {
      const restoredMemo = await restoreMemoFromTrash(id, user.id);
      return NextResponse.json(restoredMemo, { status: 200 });
    }

    // 일반 업데이트
    if (title !== undefined || content !== undefined || folderId !== undefined) {
      // 소유자가 아닌 경우 Live Share 권한 확인
      if (!isOwner) {
        if (!currentMemo.isLiveShareEnabled) {
          throw new ApiError('Access denied: Memo is not shared for editing', 403);
        }

        // Live Share 모드에 따라 접근 제어
        if (currentMemo.liveShareMode === "private") {
          if (!currentMemo.allowedUsers.includes(user.id)) {
            throw new ApiError('Access denied: Not in allowed users list', 403);
          }
        }

        // 쓰기 권한 확인
        if (currentMemo.liveSharePermission !== "readWrite") {
          throw new ApiError('Access denied: Read-only permission', 403);
        }
      }

      const memo = await updateMemo(
        id,
        currentMemo.userId!,
        title !== undefined ? title.trim() : currentMemo.title,
        content !== undefined ? content : currentMemo.content,
        folderId !== undefined ? folderId : currentMemo.folderId
      );
      return NextResponse.json(memo, { status: 200 });
    }

    // 태그 추가/제거
    if (action && tags) {
      if (tags.length === 0) {
        return NextResponse.json({ error: 'Tags array cannot be empty' }, { status: 400 });
      }

      // 소유자가 아닌 경우 Live Share 권한 확인
      if (!isOwner) {
        if (!currentMemo.isLiveShareEnabled) {
          throw new ApiError('Access denied: Memo is not shared for editing', 403);
        }

        // Live Share 모드에 따라 접근 제어
        if (currentMemo.liveShareMode === "private") {
          if (!currentMemo.allowedUsers.includes(user.id)) {
            throw new ApiError('Access denied: Not in allowed users list', 403);
          }
        }

        // 쓰기 권한 확인
        if (currentMemo.liveSharePermission !== "readWrite") {
          throw new ApiError('Access denied: Read-only permission', 403);
        }
      }

      switch (action) {
        case 'addTag':
          // 태그 추가 로직
          const tagPromises = tags.map((tagName: string) => {
            if (typeof tagName !== 'string' || !tagName.trim()) {
              throw new Error('Tag names must be non-empty strings');
            }
            return addTagToMemo(id, currentMemo.userId!, tagName.trim());
          });
          await Promise.all(tagPromises);
          break;
        case 'removeTag':
          // 태그 제거 로직
          const removePromises = tags.map((tagId: string) => {
            if (typeof tagId !== 'string' || !tagId.trim()) {
              throw new Error('Tag IDs must be non-empty strings');
            }
            return removeTagFromMemo(id, currentMemo.userId!, tagId.trim());
          });
          await Promise.all(removePromises);
          break;
      }

      // 업데이트된 메모 반환
      const updatedMemo = await getMemoById(id, currentMemo.userId!);
      return NextResponse.json(updatedMemo, { status: 200 });
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });
  } catch (error) {
    return handleApiRouteError(error);
  }
}
