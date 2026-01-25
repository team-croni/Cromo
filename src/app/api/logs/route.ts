import { logger } from '@/utils/logger';
import { NextRequest } from 'next/server';

// 로그를 조회하는 GET 메서드
export const GET = async (request: NextRequest) => {
  try {
    // URL 파라미터에서 필터 값 가져오기
    const { searchParams } = new URL(request.url);
    const level = searchParams.getAll('level');
    const tag = searchParams.getAll('tag');
    const search = searchParams.get('search') || '';
    const method = searchParams.getAll('method');
    const statusCode = searchParams.getAll('statusCode');
    const host = searchParams.get('host') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // 필요한 request 정보만 추출
    const requestData = {
      method: request.method,
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      },
      searchParams: {
        level,
        tag,
        search,
        method,
        statusCode,
        host,
        dateFrom,
        dateTo
      }
    };

    // Axiom API를 통해 로그 조회
    const dataset = process.env.AXIOM_DATASET;
    const token = process.env.AXIOM_TOKEN;

    if (!dataset || !token) {
      logger.error('Axiom credentials missing', {
        tag: 'SERVER',
        request: requestData,
        dataset: !!dataset,
        token: !!token
      });

      return new Response(
        JSON.stringify({ error: 'Axiom credentials not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 날짜 파라미터를 ISO 형식으로 변환 (사용자 로컬 시간 기준 처리)
    const convertToDateRange = (dateStr: string, isEndDate: boolean = false) => {
      if (!dateStr) return undefined;

      try {
        // 날짜 문자열을 파싱 (YYYY-MM-DD 형식 가정)
        const [year, month, day] = dateStr.split('-').map(Number);

        // 유효한 날짜인지 확인
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
          throw new Error('Invalid date');
        }

        // 시작 날짜는 00:00:00, 종료 날짜는 23:59:59로 설정
        if (!isEndDate) {
          date.setHours(0, 0, 0, 0);
        } else {
          date.setHours(23, 59, 59, 999);
        }

        return date.toISOString();
      } catch (e) {
        logger.error('Invalid date format', {
          tag: 'SERVER',
          request: requestData,
          dateStr,
          error: e instanceof Error ? e.message : 'Unknown error'
        });
        return undefined;
      }
    };

    const startDate = convertToDateRange(dateFrom);
    const endDate = convertToDateRange(dateTo, true);

    // Axiom API 호출을 위한 APL 쿼리 구성
    let aplQuery = `['${dataset}']`;

    // 필터 조건 추가
    const filters: string[] = [];

    // 레벨 필터 - 배열을 OR 조건으로 변환 (여러 가능한 필드 이름 시도)
    if (level && level.length > 0) {
      filters.push(`(level in (${level.map(l => `'${l}'`).join(', ')}) or ['fields.level'] in (${level.map(l => `'${l}'`).join(', ')}))`);
    }

    // 카테고리 필터 - 배열을 OR 조건으로 변환 (여러 가능한 필드 이름 시도)
    if (tag && tag.length > 0) {
      filters.push(`(['fields.tag'] in (${tag.map(c => `'${c}'`).join(', ')}))`);
    }

    if (search) filters.push(`(msg contains '${search}' or message contains '${search}')`);

    // HTTP 메서드 필터 - 배열을 OR 조건으로 변환 (여러 가능한 필드 이름 시도)
    if (method && method.length > 0) {
      const methodConditions = method.map(m => `(['fields.method'] == '${m}' or ['fields.request.method'] == '${m}')`);
      filters.push(`(${methodConditions.join(' or ')})`);
    }

    // 상태 코드 필터 - 배열을 OR 조건으로 변환 (여러 가능한 필드 이름 시도)
    if (statusCode && statusCode.length > 0) {
      const statusConditions = statusCode.map(status => {
        if (status.endsWith('xx')) {
          // 2xx, 3xx, 4xx, 5xx 형식의 범위 필터
          const rangePrefix = status.charAt(0);
          return `(['fields.statusCode'] startswith '${rangePrefix}' or ['fields.request.statusCode'] startswith '${rangePrefix}')`;
        } else {
          // 특정 상태 코드 필터
          return `(['fields.statusCode'] == '${status}' or ['fields.request.statusCode'] == '${status}')`;
        }
      });
      filters.push(`(${statusConditions.join(' or ')})`);
    }

    // 호스트 필터 추가
    if (host) {
      filters.push(`(['fields.host'] == '${host}' or ['fields.request.host'] == '${host}')`);
    }

    // 날짜 범위 필터 추가
    if (startDate) filters.push(`_time >= datetime('${startDate}')`);
    if (endDate) filters.push(`_time <= datetime('${endDate}')`);

    if (filters.length > 0) {
      aplQuery += ` | where ${filters.join(' and ')}`;
    }

    // 최신 로그부터 정렬
    aplQuery += ' | sort by _time desc';

    // 페이지네이션 제거 - 전체 로그 반환
    // aplQuery += ' | limit 100';

    // Axiom API 호출
    const response = await fetch('https://api.axiom.co/v1/datasets/_apl?format=tabular', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apl: aplQuery,
      }),
    });

    // 응답이 성공적이지 않은 경우 에러 처리
    if (!response.ok) {
      const errorText = await response.text();

      logger.error('Failed to fetch logs from Axiom', {
        tag: 'SERVER',
        request: requestData,
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      return new Response(
        JSON.stringify({ error: 'Failed to fetch logs', details: errorText }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const logs = await response.json();

    // Axiom의 새로운 응답 형식 처리
    const table = logs.tables[0];
    const columns = table.columns;

    // columns를 객체 배열로 변환
    const rows: Record<string, any>[] = [];
    if (columns && columns.length > 0 && columns[0].length > 0) {
      const rowCount = columns[0].length;
      for (let i = 0; i < rowCount; i++) {
        const row: Record<string, any> = {};
        table.fields.forEach((field: any, index: number) => {
          row[field.name] = columns[index][i];
        });
        rows.push(row);
      }
    }

    // 전체 로그 응답 형식으로 변환 (페이지네이션 제거)
    const responsePayload = {
      rows: rows,
      metadata: {
        totalRows: logs.status.rowsMatched,
      }
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // 필요한 request 정보만 추출
    const requestData = {
      method: request.method,
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      }
    };

    logger.error('Unexpected error in logs API', {
      tag: 'SERVER',
      request: requestData,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// 로그를 전송하는 POST 메서드
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // 필요한 request 정보만 추출
    const requestData = {
      method: request.method,
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      },
      body: {
        level: body.level,
        message: body.message
      }
    };

    // 필수 필드 검증
    if (!body.message) {
      logger.warn('Log submission missing message', {
        tag: 'SERVER',
        body,
        request: requestData
      });
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 로그 레벨 기본값 설정
    const level = body.level || 'info';
    const message = body.message;
    const fields = body.fields || {};

    // 로그 레벨에 따라 적절한 로거 메서드 호출
    switch (level.toLowerCase()) {
      case 'debug':
        logger.debug(message, fields);
        break;
      case 'info':
        logger.info(message, fields);
        break;
      case 'warn':
        logger.warn(message, fields);
        break;
      case 'error':
        logger.error(message, fields);
        break;
      default:
        logger.info(message, fields);
    }

    // 로그 전송 성공 메시지는 로컬에서만 출력하고 Axiom에는 전송하지 않음
    console.log('Log submitted successfully:', { level, message });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // 필요한 request 정보만 추출
    const requestData = {
      method: request.method,
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      }
    };

    logger.error('Failed to submit log', {
      tag: 'SERVER',
      request: requestData,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return new Response(
      JSON.stringify({ error: 'Failed to submit log' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const dynamic = 'force-dynamic';
