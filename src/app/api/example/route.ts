import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

/**
 * 예제 API 라우트
 * 
 * 이 파일은 새로운 API 엔드포인트를 만들 때 참고할 수 있는 예제입니다.
 * 실제 사용시에는 필요에 따라 수정하여 사용하세요.
 */

// GET 요청 핸들러
export async function GET(request: NextRequest) {
  // 요청 정보 로깅
  logger.api.request('예제 API 요청 수신 (GET)', request);

  try {
    const startTime = Date.now();

    // 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'World';

    // 예시 데이터
    const data = {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      method: 'GET'
    };

    const duration = Date.now() - startTime;

    // 응답 정보 로깅
    logger.api.response('예제 API 응답 전송 (GET)', request, {
      status: 200,
      duration,
      size: JSON.stringify(data).length
    });

    return NextResponse.json(data);
  } catch (error) {
    // 에러 로깅
    logger.api.error('예제 API 에러 발생 (GET)', request, error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST 요청 핸들러
export async function POST(request: NextRequest) {
  // 요청 정보 로깅
  logger.api.request('예제 API 요청 수신 (POST)', request);

  try {
    const startTime = Date.now();

    // 요청 본문 파싱
    const body = await request.json();

    // 예시 데이터
    const data = {
      message: 'Data received successfully',
      receivedData: body,
      timestamp: new Date().toISOString(),
      method: 'POST'
    };

    const duration = Date.now() - startTime;

    // 응답 정보 로깅
    logger.api.response('예제 API 응답 전송 (POST)', request, {
      status: 201,
      duration,
      size: JSON.stringify(data).length
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // 에러 로깅
    logger.api.error('예제 API 에러 발생 (POST)', request, error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 동적 라우팅을 사용하는 경우 dynamic 설정
export const dynamic = 'force-dynamic';