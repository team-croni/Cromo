/**
 * API 응답 에러를 처리하는 유틸리티 함수
 * @param response - fetch API의 Response 객체
 * @param entityName - 엔티티 이름 (예: 'memo', 'folder')
 * @returns Promise<void>
 */
export async function handleApiError(response: Response, entityName: string): Promise<void> {
  const errorText = await response.text();
  console.error(`[API] Failed to fetch ${entityName}. Status: ${response.status}, Error: ${errorText}`);
  throw new Error(`Failed to fetch ${entityName}: ${response.status} ${response.statusText}`);
}

/**
 * 네트워크 및 기타 예외를 처리하는 유틸리티 함수
 * @param error - 발생한 에러
 * @param entityName - 엔티티 이름 (예: 'memo', 'folder')
 * @param action - 수행하려던 작업 (예: 'fetch', 'create', 'update')
 */
export function handleGenericError(error: unknown, entityName: string, action: string): never {
  if (error instanceof Error) {
    console.error(`[API] Error ${action}ing ${entityName}:`, error.message);
    throw error;
  } else {
    console.error(`[API] Unknown error ${action}ing ${entityName}:`, error);
    throw new Error(`An unknown error occurred while ${action}ing the ${entityName}`);
  }
}

/**
 * React Query를 위한 기본 재시도 설정
 */
export const defaultRetryConfig = {
  retry: 2,
  retryDelay: (attemptIndex: number) => {
    return Math.min(1000 * 2 ** attemptIndex, 30000); // 지수 백오프 적용 (최대 30초)
  },
};