import { prisma } from './prisma';

// 태그 생성 함수
export async function createTag(name: string) {
  try {
    // 이미 존재하는 태그인지 확인
    let tag = await prisma.tag.findUnique({
      where: {
        name,
      },
    });

    // 존재하지 않으면 새로 생성
    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name,
        },
      });
    }

    return tag;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

// 메모에 태그 추가 함수
export async function addTagToMemo(memoId: string, userId: string, tagName: string) {
  try {
    // 메모 소유권 확인
    const memo = await prisma.memo.findUnique({
      where: {
        id: memoId,
        userId,
        isUserDeleted: false,
      },
    });

    if (!memo) {
      throw new Error('Memo not found or access denied');
    }

    // 태그 생성 또는 가져오기
    const tag = await createTag(tagName);

    // 메모와 태그 연결 (Implicit m-n relation)
    const updatedMemo = await prisma.memo.update({
      where: {
        id: memoId,
      },
      data: {
        tags: {
          connect: {
            id: tag.id
          }
        }
      }
    });

    return updatedMemo;
  } catch (error) {
    console.error('Error adding tag to memo:', error);
    throw error;
  }
}

// 메모에서 태그 제거 함수
export async function removeTagFromMemo(memoId: string, userId: string, tagId: string) {
  try {
    // 메모 소유권 확인
    const memo = await prisma.memo.findUnique({
      where: {
        id: memoId,
        userId,
        isUserDeleted: false,
      },
    });

    if (!memo) {
      throw new Error('Memo not found or access denied');
    }

    // 메모와 태그 연결 해제 (Implicit m-n relation)
    const updatedMemo = await prisma.memo.update({
      where: {
        id: memoId,
      },
      data: {
        tags: {
          disconnect: {
            id: tagId
          }
        }
      }
    });

    return updatedMemo;
  } catch (error) {
    console.error('Error removing tag from memo:', error);
    throw error;
  }
}