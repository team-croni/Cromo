import { useEffect } from 'react';
import { useAutoSaveFailureStore } from '@store/autoSaveFailureStore';
import { useErrorDisplayStore } from '@store/errorDisplayStore';
import { TriangleAlert, X } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

export function ErrorDisplay() {
  const searchParams = useSearchParams();
  const params = useParams();
  const urlMemoId = searchParams.get('id') || params.id as string;
  const { isAutoSaveFailed, getErrorDetails, failedMemoIds, errorDetails } = useAutoSaveFailureStore();
  const { isVisible, message, errorType, showError, hideError } = useErrorDisplayStore();

  useEffect(() => {
    // 현재 메모 ID가 있고 자동 저장에 실패한 경우
    if (urlMemoId) {
      const failed = isAutoSaveFailed(urlMemoId);

      if (failed) {
        const errorDetailsResult = getErrorDetails(urlMemoId);

        if (errorDetailsResult) {
          showError(errorDetailsResult.message, errorDetailsResult.type);
        } else {
          // 에러 상세 정보가 없는 경우에도 표시
          showError('자동 저장 중 오류가 발생했습니다.', 'UNKNOWN_ERROR');
        }
      } else {
        // 실패 상태가 아닌 경우 숨김
        hideError();
      }
    } else {
      // 메모 ID가 없는 경우 숨김
      hideError();
    }
  }, [urlMemoId, isAutoSaveFailed, getErrorDetails, failedMemoIds, errorDetails, showError, hideError]);

  // 에러 타입에 따른 메시지 매핑
  const getErrorMessageByType = () => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return message || '인터넷 연결이 끊어져 변경사항 저장에 실패했습니다.';
      case 'SERVER_ERROR':
        return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 'UNKNOWN_ERROR':
        return message || '자동 저장 중 오류가 발생했습니다. 다시 시도해주세요.';
      case 'AI_ERROR':
        return 'AI 기능 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return message || '자동 저장 중 오류가 발생했습니다.';
    }
  };

  return (
    <div className={`absolute px-4 w-full bottom-26 left-1/2 transform -translate-x-1/2 z-50 transition-all ${isVisible ? '' : 'opacity-0 pointer-events-none scale-80'}`}>
      <div className="w-fit mx-auto bg-inverse text-sm text-destructive font-normal px-5 py-2 rounded-xl shadow-lg/3 dark:shadow-lg/15 flex items-center">
        <TriangleAlert className="w-5 h-5 mr-4" />
        <span>{getErrorMessageByType()}</span>
        <button
          onClick={hideError}
          className="p-2 ml-5 -mr-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground rounded-full"
        >
          <X className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
}
