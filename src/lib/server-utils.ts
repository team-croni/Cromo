import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new ApiError('Unauthorized', 401);
  }
  return session.user;
}

export function handleApiRouteError(error: unknown) {
  console.error('API Route Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Common error patterns
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication required')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (errorMessage.includes('Access denied')) {
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }

  if (errorMessage.includes('not found')) {
    return NextResponse.json({ error: errorMessage }, { status: 404 });
  }

  if (errorMessage.includes('required') || errorMessage.includes('Invalid') || errorMessage.includes('must be')) {
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  // Prisma Errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string };
    if (prismaError.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate entry or constraint violation' }, { status: 409 });
    }
    if (prismaError.code === 'P2003') {
      return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
    }
    if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
  }

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
