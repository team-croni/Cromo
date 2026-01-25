import { AutoSaveErrorType } from "@/store/autoSaveFailureStore";

export const getErrorMessage = (error: unknown) => {
  let errorType: AutoSaveErrorType = 'UNKNOWN_ERROR';
  let errorMessage = '알 수 없는 오류가 발생했습니다.';

  if (error instanceof Error) {
    errorMessage = error.message;
    // 네트워크 에러 구분
    if (error.message.includes('Failed to fetch') ||
      error.message.includes('ERR_INTERNET_DISCONNECTED') ||
      error.message.includes('NetworkError')) {
      errorType = 'NETWORK_ERROR';
    }
    // 서버 에러 구분 (5xx 상태 코드)
    else if (error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')) {
      errorType = 'SERVER_ERROR';
    }
  }

  return { errorType, errorMessage };
}
