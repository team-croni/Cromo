import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_AVATAR_GRADIENT } from "@/constants/avatar-gradients";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    // 데이터베이스에서 최신 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatarColor: true,
        avatarType: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            provider: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 기본값 설정
    const userWithDefaults = {
      ...user,
      avatarColor: user.avatarColor || DEFAULT_AVATAR_GRADIENT,
      avatarType: user.avatarType || "gradient"
    };

    return NextResponse.json(userWithDefaults);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}