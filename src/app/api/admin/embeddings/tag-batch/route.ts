import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/utils/logger';
import tagService from '@/services/tagService';

export const dynamic = 'force-dynamic';

/**
 * 태그 임베딩 일괄 처리 API
 * POST /api/admin/embeddings/tag-batch
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.api.request('태그 임베딩 일괄 처리 요청 수신', request);

    const startTime = Date.now();

    // 태그 임베딩 배치 처리 실행
    const result = await tagService.processBatchTagEmbeddings();

    const duration = Date.now() - startTime;

    logger.api.response('태그 임베딩 일괄 처리 완료', request, {
      status: 200,
      duration,
      size: JSON.stringify(result).length
    });

    return NextResponse.json({
      success: true,
      message: '태그 임베딩 일괄 처리가 완료되었습니다.',
      ...result,
      duration: `${duration}ms`
    });
  } catch (error) {
    logger.api.error('태그 임베딩 일괄 처리 중 오류 발생', request, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '태그 임베딩 일괄 처리 실패'
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청으로도 실행 가능 (간편 실행용)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}

