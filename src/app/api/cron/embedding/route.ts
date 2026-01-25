import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 요청 정보 로깅
  logger.api.request('임베딩 배치 처리 요청 수신 (이 기능은 더 이상 사용되지 않습니다)', request);

  // 이 크론 작업은 더 이상 사용되지 않음
  return NextResponse.json({
    success: false,
    message: '이 크론 작업은 더 이상 사용되지 않습니다. 백그라운드 작업 시스템으로 전환되었습니다.',
  });
}
