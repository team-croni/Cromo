import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 트랜잭션으로 관련 데이터를 soft delete하고 사용자는 soft delete 처리
    await prisma.$transaction(async (tx) => {
      // 1. 공유 메모 관계 삭제
      await tx.userSharedMemo.deleteMany({
        where: { userId },
      });

      // 2. 메모 soft delete (사용자가 소유한 메모는 90일 동안 보존)
      await tx.memo.updateMany({
        where: { userId },
        data: {
          isUserDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 3. 폴더 soft delete (사용자가 소유한 폴더는 90일 동안 보존)
      await tx.folder.updateMany({
        where: { userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 4. 계정(OAuth) 연결 삭제
      await tx.account.deleteMany({
        where: { userId },
      });

      // 5. 세션 삭제
      await tx.session.deleteMany({
        where: { userId },
      });

      // 6. 사용자 soft delete - 삭제 일시 기록 (90일 후 실제 삭제될 예정)
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
        },
      });
    });

    // 계정 삭제 후 프론트엔드에서 로컬 스토리지 및 쿠키 삭제를 수행하도록 명령 포함
    const response = NextResponse.json({
      message: "Account deleted successfully",
      clearLocalStorage: true,
      clearCookies: true
    });

    // 쿠키 삭제를 위한 설정
    response.cookies.set('next-auth.session-token', '', {
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('next-auth.csrf-token', '', {
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Failed to delete user account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
