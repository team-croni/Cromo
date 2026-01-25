import { Ring } from 'ldrs/react'
import { LiveShareUsers } from "@components/collaboration/live-share-users";
import { LiveShareSettingsDropdown } from "@components/collaboration/live-share-settings-dropdown";
import { Play, Square, Copy, Check, Link } from 'lucide-react';
import { useMemo } from '@hooks/useMemo';
import { useState } from 'react';
import { useEditorStore } from '@store/editorStore';
import { useEditorSave } from '@hooks/useEditorSave';

export function LiveShareStatus() {
  const { data: memoData, isCurrentMemoOwner } = useMemo();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const { title, isLiveShareLoading, liveSharePermission, scrollY } = useEditorStore();
  const { updateLiveShareSettings } = useEditorSave();

  // 스크롤 100px 이상 내렸을 때 표시할 타이틀
  const showTitle = scrollY > 100;

  // 공유 링크 생성 함수
  const generateShareLink = async () => {
    if (!memoData?.id) return;

    setIsGeneratingShareLink(true);
    try {
      const response = await fetch(`/api/memos/${memoData.id}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('공유 링크 생성에 실패했습니다.');
    } finally {
      setIsGeneratingShareLink(false);
    }
  };

  // 클립보드에 복사 함수
  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute left-0 top-0 h-14 w-[calc(100%-18px)] px-6 text-sm flex items-center justify-between z-10">
      <div
        className='absolute top-0 left-0 w-full h-30 -z-1 transition-all duration-75 pointer-events-none'
        style={{ background: "linear-gradient(var(--color-background) 25%, transparent)" }}
      />
      <LiveShareUsers />

      <div className="flex items-center">
        {!isCurrentMemoOwner && (
          <div className="flex">
            {memoData?.isLiveShareEnabled ?
              liveSharePermission === "readOnly" ?
                <span className="text-primary slide-left">
                  이 메모는 현재 읽기만 허용됩니다.
                </span> : null :
              <span className="text-destructive slide-left">실시간 공유가 종료되었습니다.</span>
            }
          </div>
        )}

        {/* Live Share 설정 토글 */}
        {isCurrentMemoOwner && (
          <div className="flex items-center space-x-1 -mr-2">
            <button
              onClick={() => updateLiveShareSettings({ isLiveShareEnabled: !memoData?.isLiveShareEnabled })}
              className={`text-xs text-muted-foreground hover:text-foreground group flex items-center ${isLiveShareLoading ? 'opacity-50 pointer-events-none' : ''}`}
              disabled={isLiveShareLoading || !isCurrentMemoOwner}
              title={!isCurrentMemoOwner ? "라이브 공유 설정은 메모 소유자만 변경할 수 있습니다" : ""}
            >
              {isLiveShareLoading ? (
                <>
                  <div className="flex items-center px-2 gap-2">
                    <Ring
                      size="12"
                      speed="2"
                      stroke={1.5}
                      color="currentColor"
                      bgOpacity={0.2}
                    />
                    <span>{!!memoData?.isLiveShareEnabled ? 'LIVE 시작' : 'LIVE 종료'}</span>
                  </div>
                </>
              ) : !!memoData?.isLiveShareEnabled ? (
                <div className='flex items-center px-2 py-2 rounded-full'>
                  <Square className='w-2.5 h-2.5 m-0.5 fill-muted-foreground group-hover:fill-foreground mr-2' />
                  LIVE 종료
                </div>
              ) : (
                <div className='flex items-center px-2 py-2 rounded-full'>
                  <Play className='w-2.5 h-2.5 m-0.5 fill-muted-foreground group-hover:fill-foreground mr-2' />
                  LIVE 시작
                </div>
              )}
            </button>
            {/* 공유 링크 생성 버튼 */}
            <button
              onClick={generateShareLink}
              className={`text-xs text-muted-foreground hover:text-foreground group flex items-center ${isGeneratingShareLink ? 'opacity-50 pointer-events-none' : ''}`}
              disabled={isGeneratingShareLink || !isCurrentMemoOwner}
              title="공유 링크 생성"
            >
              {isGeneratingShareLink ? (
                <div className="flex items-center px-2 gap-2">
                  <Ring
                    size="12"
                    speed="2"
                    stroke={1.5}
                    color="currentColor"
                    bgOpacity={0.2}
                  />
                  <span>생성 중...</span>
                </div>
              ) : shareUrl ? null
                : (
                  <div className='flex items-center px-2 py-2 rounded-full'>
                    <Link className='w-2.5 h-2.5 m-0.5 text-muted-foreground group-hover:text-foreground mr-2' />
                    공유 링크
                  </div>
                )}
            </button>

            {/* 공유 링크 복사 버튼 */}
            {shareUrl && (
              <button
                onClick={copyToClipboard}
                className="text-xs text-muted-foreground hover:text-foreground group flex items-center"
                title="링크 복사"
              >
                <div className='flex items-center px-2 py-2 rounded-full'>
                  {copied ? (
                    <Check className='w-3 h-3 mr-2' />
                  ) : (
                    <Copy className='w-3 h-3 mr-2' />
                  )}
                  {copied ? '복사 완료' : '링크 복사'}
                </div>
              </button>
            )}

            <LiveShareSettingsDropdown />
          </div>
        )}

        <div className={`absolute left-[calc(50%-18px)] -translate-x-1/2 text-base transition-all duration-75 ease-out font-medium text-center text-foreground line-clamp-1 ${showTitle ? 'opacity-100' : 'translate-y-1 opacity-0'}`}>
          {title || ''}
        </div>
      </div>
    </div>
  );
}