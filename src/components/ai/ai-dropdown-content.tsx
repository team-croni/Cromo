import React from 'react';
import {
  Loader2,
  Paintbrush,
  PencilLine,
  Type
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ToolbarDropdownItem } from '@components/ui/toolbar-dropdown-item';
import { applyAICorrectionsToEditor } from '@utils/editorExtensions';
import { useEditorToolbarStore } from '@store/editorToolbarStore';
import { useErrorDisplayStore } from '@store/errorDisplayStore';
import { useEditorStore } from '@store/editorStore';
import { useEditorSave } from '@hooks/useEditorSave';
import { useEditorToolbar } from '@hooks/use-editor-toolbar';

export const AIDropdownContent = ({ onClose }: { onClose?: () => void }) => {
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  const { setAILoading } = useEditorToolbarStore();
  const { showError } = useErrorDisplayStore();
  const { currentEditor: editor } = useEditorStore();
  const { handleTitleChange } = useEditorSave();
  const { setTitle } = useEditorStore();

  const {
    onAIStart,
    onAIComplete,
    onAIFailed,
    onCorrectionsFound,
  } = useEditorToolbar();

  const handleAICleanContent = async () => {
    onClose?.();
    setIsProcessing('clean');
    onAIStart?.('전체 내용을 정리하고 있습니다...');
    try {
      const fullContent = editor?.getHTML() || '';
      if (!fullContent.trim()) {
        onAIFailed?.();
        return;
      }

      const response = await fetch('/api/ai-clean-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fullContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 정리에 실패했습니다.');
      }

      const data = await response.json();
      if (data.cleanedContent) {
        try {
          // AI 응답이 마크다운 형식일 수 있으므로 HTML로 변환
          const markdownText = data.cleanedContent;

          // 줄바꿈 두 개를 세 개로 변경 (마크다운 파싱을 위해)
          const modifiedText = markdownText.replace(/\n\n/g, '\n<p></p>\n\n');

          // 마크다운을 HTML로 변환
          let html = DOMPurify.sanitize(marked.parse(modifiedText) as string);

          // 코드 블록 내부를 제외하고 줄바꿈 제거
          html = html.replace(/(<pre[^>]*>[\s\S]*?<\/pre>)|(\n)/g, (match, codeBlock) => {
            // 코드 블록인 경우 원본 유지
            if (codeBlock) {
              return codeBlock;
            }
            // 일반 줄바꿈은 제거
            return '';
          });

          // 변환된 HTML을 에디터에 적용
          onAIComplete?.();
          editor?.commands.setContent(html);
        } catch (parseError) {
          console.error('마크다운 파싱 오류:', parseError);
          // 파싱 실패시 기본 텍스트로 적용
          onAIComplete?.();
          editor?.commands.setContent(data.cleanedContent);
          alert('AI 정리가 완료되었습니다! (마크다운 형식만 적용)');
        }
      } else {
        onAIFailed?.();
      }
    } catch (error: any) {
      console.error('AI 정리 오류:', error);
      showError('AI 기능 요청 중 오류가 발생했습니다.', 'AI_ERROR');
      onAIFailed?.();
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSpellCheck = async () => {
    onClose?.();
    setIsProcessing('spell');
    onAIStart?.('오타를 찾고 있습니다...');
    try {
      // 전체 HTML 콘텐츠 가져오기
      const content = editor?.getText() || '';
      if (!content.trim()) {
        onAIFailed?.();
        return;
      }

      const response = await fetch('/api/ai-spell-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 오타 수정에 실패했습니다.');
      }

      const data = await response.json();


      if (data.corrections && Array.isArray(data.corrections)) {
        // delete와 insert 값이 동일한 항목 제거
        const meaningfulCorrections = data.corrections.filter((correction: { delete: string; insert: string }) =>
          correction.delete !== correction.insert
        );

        // 중복 교정 단어 제거
        const uniqueCorrections = meaningfulCorrections.filter((correction: { delete: string; insert: string }, index: number, arr: Array<{ delete: string; insert: string }>) =>
          arr.findIndex(c => c.delete === correction.delete && c.insert === correction.insert) === index
        );
        // 이메일, URL 등 패턴 제외
        const filteredCorrections = uniqueCorrections.filter((correction: { delete: string; insert: string }) => {
          const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
          const urlRegex = /\bhttps?:\/\/[^\s]+\b/;
          return !emailRegex.test(correction.delete) && !emailRegex.test(correction.insert) &&
            !urlRegex.test(correction.delete) && !urlRegex.test(correction.insert);
        });

        if (filteredCorrections.length > 0) {
          // JSON 응답의 수정 사항을 에디터에 시각적으로 표시
          onAIComplete?.();
          applyAICorrectionsToEditor(editor, filteredCorrections);
          onCorrectionsFound?.(filteredCorrections);
        } else {
          alert('수정할 오타가 발견되지 않았습니다.');
          // 오타가 없을 때도 완료 처리
          onAIFailed?.(); // 실패는 아니지만 UI 복귀를 위해
        }
      } else {
        alert('수정할 오타가 발견되지 않았습니다.');
        // 오타가 없을 때도 완료 처리
        onAIFailed?.(); // 실패는 아니지만 UI 복귀를 위해
      }
    } catch (error: any) {
      console.error('AI 오타 수정 오류:', error);
      showError('AI 기능 요청 중 오류가 발생했습니다.', 'AI_ERROR');
      onAIFailed?.();
    } finally {
      setIsProcessing(null);
    }
  };

  const handleGenerateTitle = async () => {
    onClose?.();
    const content = editor?.getText() || '';
    if (!content || content.length < 50) {
      return;
    }

    setIsProcessing('title');
    onAIStart?.('제목을 생성하고 있습니다...');
    try {
      const response = await fetch('/api/ai-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      const generatedTitle = data.title;

      // '내용이 없는 메모'일 경우에도 제목 업데이트
      if (generatedTitle && generatedTitle !== '내용이 없는 메모') {
        handleTitleChange({ target: { value: generatedTitle } } as React.ChangeEvent<HTMLInputElement>)
      }

      setAILoading(false);
    } catch (error) {
      console.error('AI 제목 생성 오류:', error);
      showError('AI 기능 요청 중 오류가 발생했습니다.', 'AI_ERROR');
      onAIFailed?.();
    } finally {
      setIsProcessing(null);
    }
  };


  const aiFeatures = [
    {
      icon: <Type size={16} strokeWidth={1} />,
      label: '제목 생성',
      description: '내용을 읽고 적절한 제목 생성',
      command: handleGenerateTitle,
      isLoading: isProcessing === 'title',
      disabled: !editor || editor.getText().length < 50
    },
    {
      icon: <Paintbrush size={16} strokeWidth={1} />,
      label: '전체 정리',
      description: '전체 내용을 정리해서 재작성',
      command: handleAICleanContent,
      isLoading: isProcessing === 'clean'
    },
    {
      icon: <PencilLine size={16} strokeWidth={1} />,
      label: '오타 수정',
      description: '전체 문서 오타 수정',
      command: handleSpellCheck,
      isLoading: isProcessing === 'spell'
    }
  ];

  return (
    <div className="space-y-0.5 min-w-30">
      {aiFeatures.map((feature, index) => (
        <ToolbarDropdownItem
          key={index}
          icon={feature.isLoading ? <Loader2 size={18} className="animate-spin" /> : feature.icon}
          label={feature.label}
          disabled={feature.disabled || feature.isLoading}
          onClick={() => feature.command()}
          className={feature.isLoading ? 'pointer-events-none opacity-60' : ''}
        />
      ))}
    </div>
  );
};
