import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { newOrder } = await request.json();

    if (typeof newOrder !== 'number') {
      return NextResponse.json(
        { error: 'newOrder는 숫자여야 합니다' },
        { status: 400 }
      );
    }

    // folderId로 folder 찾기
    const folder = await prisma.folder.findUnique({
      where: { id, isDeleted: false },
      include: {
        children: {
          select: { id: true, order: true }
        }
      }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 현재 레벨의 모든 폴더들을 가져와서 순서 재배열
    const siblings = await prisma.folder.findMany({
      where: {
        parentId: folder.parentId,
        id: { not: id }, // 현재 폴더를 제외하고
        isDeleted: false,
      },
      select: { id: true, order: true },
      orderBy: { order: 'asc' }
    });

    // 새로운 순서로 폴더들의 순서를 업데이트
    const updatedSiblings = [...siblings];
    const currentFolderIndex = newOrder;
    updatedSiblings.splice(currentFolderIndex, 0, folder);

    // 모든 sibling 폴더들의 순서를 다시 매기기
    const updatePromises = updatedSiblings.map((sibling, index) => {
      if (sibling.id === id) {
        // 현재 folder의 순서 업데이트
        return prisma.folder.update({
          where: { id: sibling.id },
          data: { order: index }
        });
      } else {
        // 다른 sibling들의 순서 업데이트
        return prisma.folder.update({
          where: { id: sibling.id },
          data: { order: index }
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Folder 순서가 성공적으로 업데이트되었습니다'
    });

  } catch (error) {
    console.error('Folder 순서 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: 'Folder 순서 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}