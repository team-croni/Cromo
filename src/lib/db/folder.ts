import { prisma } from "@lib/db/prisma";

// 폴더 생성 함수
export async function createFolder(name: string, parentId?: string, userId?: string) {
  try {
    // 현재 같은 parentId의 마지막 순서 찾기
    const lastFolder = await prisma.folder.findFirst({
      where: {
        parentId: parentId || null,
        userId: userId || undefined,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const nextOrder = (lastFolder?.order || 0) + 1;

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId,
        userId,
        order: nextOrder,
      },
    });
    return folder;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

// 모든 폴더 조회 함수
export async function getAllFolders(userId?: string, options: { includeChildren?: boolean; limit?: number; offset?: number } = {}) {
  const { includeChildren = false, limit, offset } = options;

  try {
    const folders = await prisma.folder.findMany({
      where: {
        userId: userId || undefined,
        isDeleted: false,
      },
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
      include: includeChildren ? { children: true } : undefined,
      take: limit,
      skip: offset,
    });
    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
}

// 특정 폴더 조회 함수
export async function getFolderById(id: string) {
  try {
    const folder = await prisma.folder.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        children: true,
        memos: true,
        parent: true,
      },
    });
    return folder;
  } catch (error) {
    console.error('Error fetching folder:', error);
    throw error;
  }
}

// 폴더 업데이트 함수
export async function updateFolder(id: string, name: string, parentId?: string, icon?: string, color?: string) {
  try {
    const data: any = {
      name,
    };

    // parentId가 undefined가 아닌 경우에만 포함
    if (parentId !== undefined) {
      data.parentId = parentId;
    }

    if (icon !== undefined) {
      data.icon = icon;
    }

    if (color !== undefined) {
      data.color = color;
    }

    const folder = await prisma.folder.update({
      where: {
        id,
      },
      data,
    });
    return folder;
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
}

// 폴더 삭제 함수
export async function deleteFolder(id: string) {
  try {
    // 먼저 폴더가 존재하는지 확인
    const folder = await prisma.folder.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    // 폴더가 존재하지 않으면 null을 반환하거나 예외를 던지지 않음
    if (!folder) {
      console.warn(`Folder with id ${id} not found`);
      return null;
    }

    // 폴더가 존재하면 삭제
    await prisma.folder.delete({
      where: {
        id,
        isDeleted: false,
      },
    });

    return folder;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
}