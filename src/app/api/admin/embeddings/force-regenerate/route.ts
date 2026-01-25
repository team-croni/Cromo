import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/utils/logger';
import embeddingService from '@/services/embeddingService';
import tagService from '@/services/tagService';

export const dynamic = 'force-dynamic';

/**
 * 모든 임베딩 강제 재생성 API
 * POST /api/admin/embeddings/force-regenerate
 * 
 * Query Parameters:
 * - type: 'memo' | 'tag' | 'all' (기본값: 'all')
 * - limit: 한 번에 처리할 최대 개수 (기본값: 50)
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    logger.api.request('임베딩 강제 재생성 요청 수신', request);

    const startTime = Date.now();
    const results: any = {
      memoEmbedding: null,
      tagEmbedding: null
    };

    // 1. 메모 임베딩 강제 재생성
    if (type === 'memo' || type === 'all') {
      try {
        const memoResult = await embeddingService.forceRegenerateEmbeddings(limit);
        results.memoEmbedding = {
          success: true,
          ...memoResult
        };
      } catch (error) {
        results.memoEmbedding = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        logger.api.error('메모 임베딩 강제 재생성 중 오류 발생', request, error);
      }
    }

    // 2. 태그 임베딩 강제 재생성
    if (type === 'tag' || type === 'all') {
      try {
        const tagResult = await tagService.forceRegenerateTagEmbeddings(limit);
        results.tagEmbedding = {
          success: true,
          ...tagResult
        };
      } catch (error) {
        results.tagEmbedding = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        logger.api.error('태그 임베딩 강제 재생성 중 오류 발생', request, error);
      }
    }

    const duration = Date.now() - startTime;

    logger.api.response('임베딩 강제 재생성 완료', request, {
      status: 200,
      duration,
      size: JSON.stringify(results).length
    });

    return NextResponse.json({
      success: true,
      message: '임베딩 강제 재생성이 완료되었습니다.',
      results,
      duration: `${duration}ms`,
      summary: {
        totalProcessed: (results.memoEmbedding?.totalCount || 0) + (results.tagEmbedding?.totalCount || 0),
        totalSuccess: (results.memoEmbedding?.successCount || 0) + (results.tagEmbedding?.successCount || 0),
        memoUpdated: results.memoEmbedding?.updatedCount || 0
      }
    });
  } catch (error) {
    logger.api.error('임베딩 강제 재생성 중 오류 발생', request, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '임베딩 강제 재생성 실패'
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

