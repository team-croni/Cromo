import { prisma } from './prisma';

// 사용자 조회 함수
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * 90일 이상 지난 soft delete된 사용자들을 영구 삭제
 */
export async function permanentlyDeleteOldSoftDeletedUsers(batchSize: number = 50) {
  try {
    // 90일 이상 지난 soft delete된 사용자들을 조회
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const usersToDelete = await prisma.user.findMany({
      where: {
        deletedAt: {
          lte: ninetyDaysAgo, // 90일 이상 지난 삭제 대상
        },
      },
      select: {
        id: true,
      },
      take: batchSize, // 한 번에 최대 batchSize명씩만 처리
    });

    let deletedCount = 0;
    if (usersToDelete.length > 0) {
      // 각 사용자에 대해 완전 삭제 처리 (hard delete)
      for (const user of usersToDelete) {
        try {
          await prisma.$transaction(async (tx) => {
            // 1. 사용자가 소유한 공유 메모 관계 삭제
            await tx.userSharedMemo.deleteMany({
              where: { userId: user.id },
            });

            // 2. 사용자가 소유한 메모 완전 삭제
            await tx.memo.deleteMany({
              where: { userId: user.id },
            });

            // 3. 사용자가 소유한 폴더 완전 삭제
            await tx.folder.deleteMany({
              where: { userId: user.id },
            });

            // 4. OAuth 계정 연결 삭제
            await tx.account.deleteMany({
              where: { userId: user.id },
            });

            // 5. 세션 삭제
            await tx.session.deleteMany({
              where: { userId: user.id },
            });

            // 6. 사용자 레코드 완전 삭제
            await tx.user.delete({
              where: { id: user.id },
            });
          });

          deletedCount++;
        } catch (error) {
          console.error(`사용자 데이터 영구 삭제 실패 (userId: ${user.id})`, error);
        }
      }
    }

    return { processed: usersToDelete.length, deleted: deletedCount };
  } catch (error) {
    console.error('삭제된 사용자 데이터 정리 중 오류 발생:', error);
    throw error;
  }
}