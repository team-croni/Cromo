import { prisma } from './prisma';

// 메모 생성 함수
export async function createMemo(title: string, content: string, isArchived: boolean, folderId?: string, userId?: string) {
  try {
    // 트랜잭션으로 처리
    const memo = await prisma.$transaction(async (tx) => {
      const newMemo = await tx.memo.create({
        data: {
          title,
          content,
          isArchived,
          folderId,
          userId,
          isTagsUpToDate: false,
          isEmbeddingUpToDate: false,
        },
      });

      return newMemo;
    });

    return memo;
  } catch (error) {
    console.error('Error creating memo:', error);
    throw error;
  }
}

// 모든 메모 조회 함수
export async function getAllMemos(userId?: string) {
  try {
    const memos = await prisma.memo.findMany({
      where: {
        isDeleted: false, // 삭제되지 않은 메모만 조회
        isUserDeleted: false,
        userId: userId || undefined, // userId가 제공되면 해당 사용자의 메모만 조회
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        folder: true,
        tags: true,
      },
    });
    return memos;
  } catch (error) {
    console.error('Error fetching memos:', error);
    throw error;
  }
}

// 최근 업데이트된 메모 조회 함수
export async function getRecentlyUpdatedMemos(limit: number = 10, userId?: string) {
  try {
    const memos = await prisma.memo.findMany({
      where: {
        isDeleted: false, // 삭제되지 않은 메모만 조회
        isUserDeleted: false,
        userId: userId || undefined, // userId가 제공되면 해당 사용자의 메모만 조회
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      include: {
        folder: true,
        tags: true,
      },
    });
    return memos;
  } catch (error) {
    console.error('Error fetching recently updated memos:', error);
    throw error;
  }
}

// 보관된 메모 조회 함수
export async function getArchivedMemos(userId?: string) {
  try {
    const memos = await prisma.memo.findMany({
      where: {
        isArchived: true,
        isDeleted: false,
        isUserDeleted: false,
        userId: userId || undefined, // userId가 제공되면 해당 사용자의 메모만 조회
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        folder: true,
        tags: true,
      },
    });
    return memos;
  } catch (error) {
    console.error('Error fetching archived memos:', error);
    throw error;
  }
}

// 휴지통 메모 조회 함수
export async function getDeletedMemos(userId?: string) {
  try {
    const memos = await prisma.memo.findMany({
      where: {
        isDeleted: true,
        isUserDeleted: false,
        userId: userId || undefined, // userId가 제공되면 해당 사용자의 메모만 조회
      },
      orderBy: {
        deletedAt: 'desc',
      },
      include: {
        folder: true,
        tags: true,
      },
    });
    return memos;
  } catch (error) {
    console.error('Error fetching deleted memos:', error);
    throw error;
  }
}

// 공유된 메모 조회 함수 (사용자가 공유 리스트에 추가한 메모만)
export async function getSharedMemos(userId: string) {
  try {
    const sharedMemoRecords = await prisma.userSharedMemo.findMany({
      where: {
        userId: userId,
        memo: {
          isUserDeleted: false,
        }
      },
      include: {
        memo: {
          include: {
            folder: true,
            // tags는 별도 쿼리로 가져오도록 수정
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      // 필요에 따라 페이징 처리를 추가할 수 있음
      take: 50, // 임시로 50개로 제한
    });

    // 삭제되지 않은 메모만 필터링하고 자신의 메모는 제외
    const memos = sharedMemoRecords
      .map(record => record.memo)
      .filter(memo => !memo.isDeleted && memo.userId !== userId)
      .map(memo => ({
        ...memo,
        content: memo.isLiveShareEnabled ? memo.content : '',
        tags: [] // 태그는 별도 쿼리에서 가져오도록 처리
      }));

    // 태그 정보를 별도 쿼리로 가져옴
    const memoIds = memos.map(memo => memo.id);
    if (memoIds.length > 0) {
      const memoTags = await prisma.tag.findMany({
        where: {
          memos: {
            some: {
              id: {
                in: memoIds
              }
            }
          }
        },
        include: {
          memos: {
            select: {
              id: true
            }
          }
        }
      });

      // 태그 정보를 메모에 매핑
      const tagMap = new Map<string, any[]>();
      memoTags.forEach(tag => {
        tag.memos.forEach(memo => {
          if (!tagMap.has(memo.id)) {
            tagMap.set(memo.id, []);
          }
          tagMap.get(memo.id)?.push(tag);
        });
      });

      // 각 메모에 해당 태그 정보 추가
      memos.forEach(memo => {
        memo.tags = tagMap.get(memo.id) || [];
      });
    }

    return memos;
  } catch (error) {
    console.error('Error fetching shared memos:', error);
    throw error;
  }
}

// 특정 메모 조회 함수
export async function getMemoById(id: string, userId: string) {
  try {
    const memo = await prisma.memo.findUnique({
      where: {
        id,
        userId,
        isUserDeleted: false,
      },
      include: {
        folder: true,
        tags: true,
        user: true,
      },
    });

    return memo;
  } catch (error) {
    console.error('Error fetching memo:', error);
    throw error;
  }
}

// 공유된 메모를 포함한 메모 조회 함수 (공유된 메모 접근 허용)
// id 파라미터가 UUID 형식이면 id로 찾고, 아니면 shareToken으로 찾음
export async function getMemoByIdWithSharedAccess(id: string, userId?: string) {
  try {
    // 입력 유효성 검증
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID parameter');
    }

    // UUID 형식인지 확인 (간단한 UUID v4 패턴)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let memo;
    if (isUUID) {
      // UUID인 경우 id로 조회
      memo = await prisma.memo.findUnique({
        where: {
          id,
          isUserDeleted: false,
        },
        include: {
          folder: true,
          tags: true,
          user: true,
        },
      });

      if (!memo) {
        throw new Error('Memo not found');
      }

      // UUID로 접근하는 경우 소유자이거나 라이브 공유 권한이 있는 사용자만 허용
      if (!userId) {
        throw new Error('Authentication required for direct memo access');
      }

      // 메모 소유자인 경우 접근 허용
      if (memo.userId === userId) {
        // 소유자이므로 접근 허용
      } else {
        // 삭제된 메모는 접근 불가
        if (memo.isDeleted) {
          throw new Error('Memo has been deleted');
        }

        // 소유자가 아닌 경우 라이브 공유 권한 확인
        if (!memo.isLiveShareEnabled) {
          throw new Error('Access denied: Memo is not shared');
        }

        // Live Share 모드에 따라 접근 제어
        if (memo.liveShareMode === "private") {
          if (!memo.allowedUsers.includes(userId)) {
            throw new Error('Access denied: Not in allowed users list');
          }
        }
        // public 모드인 경우 모든 사용자 접근 가능
      }

    } else {
      // UUID가 아닌 경우 shareToken으로 조회
      memo = await prisma.memo.findFirst({
        where: {
          shareToken: id,
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
        throw new Error('Invalid or expired share token');
      }

      // shareToken으로 접근하는 경우에도 실시간 공유가 활성화되어 있어야 함
      if (!memo.isLiveShareEnabled) {
        throw new Error('Access denied: Memo is not shared for editing');
      }

      // shareToken으로 찾은 경우는 이미 유효성 검증됨 (만료되지 않고 삭제되지 않음)
    }

    return memo;
  } catch (error) {
    console.error('Error fetching memo with shared access:', error);

    // 데이터베이스 연결 오류
    if (error && typeof error === 'object' && 'code' in error && (error.code === 'P1001' || error.code === 'P1017')) {
      throw new Error('Database connection failed');
    }

    // 기타 데이터베이스 오류
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
      throw new Error('Database query failed');
    }

    // 이미 Error 객체인 경우 그대로 throw
    if (error instanceof Error) {
      throw error;
    }

    // 예상치 못한 오류
    throw new Error('Failed to fetch memo');
  }
}

// 메모 업데이트 함수
export async function updateMemo(id: string, userId: string, title: string, content: string, folderId?: string) {
  try {
    const updateData: any = {
      title,
      content,
      updatedAt: new Date(),
      isTagsUpToDate: false,
      isEmbeddingUpToDate: false,
    };

    // folderId가 undefined가 아닌 경우에만 포함
    if (folderId !== undefined) {
      updateData.folderId = folderId;
    }

    // 트랜잭션으로 처리
    const memo = await prisma.$transaction(async (tx) => {
      // 메모 업데이트
      const updatedMemo = await tx.memo.update({
        where: {
          id,
          userId,
        },
        include: {
          folder: true,
          tags: true,
        },
        data: updateData,
      });

      return updatedMemo;
    });

    return memo;
  } catch (error) {
    console.error('Error updating memo:', error);
    throw error;
  }
}

// 메모 보관 함수
export async function archiveMemo(id: string, userId: string, isArchived: boolean = true) {
  try {
    const memo = await prisma.memo.update({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
      data: {
        isArchived,
        updatedAt: new Date(),
      },
    });
    return memo;
  } catch (error) {
    console.error('Error archiving memo:', error);
    throw error;
  }
}

// Live Share 설정 업데이트 함수
export async function updateLiveShareSettings(
  id: string,
  userId: string,
  isLiveShareEnabled: boolean,
  liveShareMode?: string,
  allowedUsers?: string[],
  liveSharePermission?: string
) {
  try {
    const updateData: any = {
      isLiveShareEnabled,
      updatedAt: new Date(),
    };

    // 선택적 파라미터들이 undefined가 아닌 경우에만 포함
    if (liveShareMode !== undefined) {
      updateData.liveShareMode = liveShareMode;
    }

    if (allowedUsers !== undefined) {
      updateData.allowedUsers = allowedUsers;
    }

    if (liveSharePermission !== undefined) {
      updateData.liveSharePermission = liveSharePermission;
    }

    const memo = await prisma.memo.update({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
      data: updateData,
    });
    return memo;
  } catch (error) {
    console.error('Error updating live share settings:', error);
    throw error;
  }
}

// 메모 휴지통 이동 함수
export async function moveMemoToTrash(id: string, userId: string) {
  try {
    const memo = await prisma.memo.update({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return memo;
  } catch (error) {
    console.error('Error moving memo to trash:', error);
    throw error;
  }
}

// 메모 휴지통에서 복원 함수
export async function restoreMemoFromTrash(id: string, userId: string) {
  try {
    const memo = await prisma.memo.update({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
      data: {
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
    return memo;
  } catch (error) {
    console.error('Error restoring memo from trash:', error);
    throw error;
  }
}

// 메모 영구 삭제 함수
export async function permanentlyDeleteMemo(id: string, userId: string) {
  try {
    await prisma.memo.delete({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
    });
  } catch (error) {
    console.error('Error permanently deleting memo:', error);
    throw error;
  }
}

// 여러 메모를 영구 삭제하는 함수 (batch)
export async function permanentlyDeleteMemos(ids: string[], userId: string) {
  try {
    const result = await prisma.memo.deleteMany({
      where: {
        id: {
          in: ids,
        },
        userId,
      },
    });
    return result;
  } catch (error) {
    console.error('Error permanently deleting memos:', error);
    throw error;
  }
}

// 메모 삭제 함수
export async function deleteMemo(id: string, userId: string) {
  try {
    await prisma.memo.delete({
      where: {
        id,
        userId,
      },
    });
  } catch (error) {
    console.error('Error deleting memo:', error);
    throw error;
  }
}

// 여러 메모를 휴지통으로 이동하는 함수 (batch)
export async function moveMemosToTrash(ids: string[], userId: string) {
  try {
    const result = await prisma.memo.updateMany({
      where: {
        id: {
          in: ids,
        },
        userId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return result;
  } catch (error) {
    console.error('Error moving memos to trash:', error);
    throw error;
  }
}

// 여러 메모를 보관함으로 이동하는 함수 (batch)
export async function archiveMemos(ids: string[], userId: string, isArchived: boolean = true) {
  try {
    const result = await prisma.memo.updateMany({
      where: {
        id: {
          in: ids,
        },
        userId,
      },
      data: {
        isArchived,
        updatedAt: new Date(),
      },
    });
    return result;
  } catch (error) {
    console.error('Error archiving memos:', error);
    throw error;
  }
}

// 여러 메모를 휴지통에서 복원하는 함수 (batch)
export async function restoreMemosFromTrash(ids: string[], userId: string) {
  try {
    const result = await prisma.memo.updateMany({
      where: {
        id: {
          in: ids,
        },
        userId,
      },
      data: {
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
    return result;
  } catch (error) {
    console.error('Error restoring memos from trash:', error);
    throw error;
  }
}

// 여러 메모를 폴더로 이동하는 함수 (batch)
export async function moveMemosToFolder(ids: string[], folderId: string | null, userId: string) {
  try {
    const result = await prisma.memo.updateMany({
      where: {
        id: {
          in: ids,
        },
        userId,
      },
      data: {
        folderId,
        updatedAt: new Date(),
      },
    });
    return result;
  } catch (error) {
    console.error('Error moving memos to folder:', error);
    throw error;
  }
}
