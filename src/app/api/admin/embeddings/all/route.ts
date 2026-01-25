import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/utils/logger';
import embeddingService from '@/services/embeddingService';
import tagService from '@/services/tagService';

export const dynamic = 'force-dynamic';

/**
 * 모든 임베딩 일괄 처리 API
 * POST /api/admin/embeddings/all
 * 메모 임베딩과 태그 임베딩을 모두 처리합니다.
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

    logger.api.request('모든 임베딩 일괄 처리 요청 수신', request);

    const startTime = Date.now();
    const results = {
      memoEmbedding: {
        success: false,
        successCount: 0,
        totalCount: 0,
        updatedCount: 0,
        error: null as string | null
      },
      tagEmbedding: {
        success: false,
        successCount: 0,
        totalCount: 0,
        error: null as string | null
      }
    };

    // 1. 메모 임베딩 처리
    try {
      const memoResult = await embeddingService.processBatchEmbeddings();
      results.memoEmbedding = {
        success: true,
        ...memoResult,
        error: null
      };
    } catch (error) {
      results.memoEmbedding.error = error instanceof Error ? error.message : 'Unknown error';
      logger.api.error('메모 임베딩 처리 중 오류 발생', request, error);
    }

    // 2. 태그 임베딩 처리
    try {
      const tagResult = await tagService.processBatchTagEmbeddings();
      results.tagEmbedding = {
        success: true,
        ...tagResult,
        error: null
      };
    } catch (error) {
      results.tagEmbedding.error = error instanceof Error ? error.message : 'Unknown error';
      logger.api.error('태그 임베딩 처리 중 오류 발생', request, error);
    }

    const duration = Date.now() - startTime;

    logger.api.response('모든 임베딩 일괄 처리 완료', request, {
      status: 200,
      duration,
      size: JSON.stringify(results).length
    });

    return NextResponse.json({
      success: true,
      message: '모든 임베딩 일괄 처리가 완료되었습니다.',
      results,
      duration: `${duration}ms`,
      summary: {
        totalProcessed: results.memoEmbedding.totalCount + results.tagEmbedding.totalCount,
        totalSuccess: results.memoEmbedding.successCount + results.tagEmbedding.successCount,
        memoUpdated: results.memoEmbedding.updatedCount
      }
    });
  } catch (error) {
    logger.api.error('모든 임베딩 일괄 처리 중 오류 발생', request, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '임베딩 일괄 처리 실패'
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

