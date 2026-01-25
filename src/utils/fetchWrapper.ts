import { handleApiError, handleGenericError } from './errorHandler';

interface FetchOptions extends RequestInit {
  retryCount?: number;
  maxRetries?: number;
}

/**
 * 네트워크 에러인지 확인하는 함수
 * @param error - 발생한 에러
 * @returns 네트워크 에러 여부
 */
function isNetworkError(error: any): boolean {
  // TypeError는 일반적으로 네트워크 문제를 나타냄
  // ex) DNS lookup failed, connection refused 등
  return error instanceof TypeError ||
    (error.name === 'TypeError') ||
    (typeof error === 'object' && error.type === 'system' && error.errno);
}

/**
 * Fetch API를 래핑한 함수로, 에러 처리, 재시도 로직 등을 포함합니다.
 * 
 * @param url - 요청할 URL
 * @param options - fetch 옵션과 추가 설정
 * @returns Promise<Response>
 */
export async function fetchWrapper<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    retryCount = 0,
    maxRetries = 3,
    ...fetchOptions
  } = options;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      await handleApiError(response, 'resource');
    }

    return await response.json();
  } catch (error) {
    // 네트워크 에러인 경우에만 재시도
    if (isNetworkError(error) && retryCount < maxRetries) {
      // 지수 백오프 딜레이
      const delay = Math.min(1000 * 2 ** retryCount, 30000);
      await new Promise(resolve => setTimeout(resolve, delay));

      return fetchWrapper(url, {
        ...options,
        retryCount: retryCount + 1
      });
    }

    return handleGenericError(error, 'resource', 'fetch');
  }
}

/**
 * GET 요청을 위한 편의 함수
 */
export function get<T>(url: string, options?: Omit<FetchOptions, 'method'>): Promise<T> {
  return fetchWrapper(url, {
    ...options,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
}

/**
 * POST 요청을 위한 편의 함수
 */
export function post<T>(url: string, body: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
  return fetchWrapper(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * PUT 요청을 위한 편의 함수
 */
export function put<T>(url: string, body: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
  return fetchWrapper(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * PATCH 요청을 위한 편의 함수
 */
export function patch<T>(url: string, body: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
  return fetchWrapper(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * DELETE 요청을 위한 편의 함수
 */
export function del<T>(url: string, options?: Omit<FetchOptions, 'method'>): Promise<T> {
  return fetchWrapper(url, {
    ...options,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
}