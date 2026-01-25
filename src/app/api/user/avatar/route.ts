import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { avatarColor, avatarType } = body;

    // Validate avatarType
    if (avatarType && !["gradient", "solid", "image"].includes(avatarType)) {
      return NextResponse.json(
        { error: "Invalid avatar type" },
        { status: 400 }
      );
    }

    // Update user avatar settings
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        avatarColor,
        avatarType,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatarColor: true,
        avatarType: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}