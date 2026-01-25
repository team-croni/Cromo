import React from 'react';

interface ReadOnlyNoticeProps {
  isVisible: boolean;
  message?: string;
}

export const ReadOnlyNotice: React.FC<ReadOnlyNoticeProps> = ({
  isVisible,
  message = "이 메모는 현재 읽기 전용입니다. 소유자만 편집할 수 있습니다."
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md" role="alert">
        <strong className="font-bold">읽기 전용 모드</strong>
        <span className="block sm:inline"> {message}</span>
      </div>
    </div>
  );
};