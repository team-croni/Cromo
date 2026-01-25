import { useCallback, useEffect } from "react";
import { getAppliedHTML } from "@/utils/editorExtensions";
import { useEditorToolbarStore } from "@/store/editorToolbarStore";
import { useEditorStore } from "@/store/editorStore";

export const useAICorrection = () => {
  const { currentEditor: editor } = useEditorStore();

  // 스토어에서 상태 가져오기
  const {
    isAILoading,
    previousContent,
    hasAIGeneratedContent,
    aiLoadingMessage,
    correctionCount,
    currentCorrectionIndex,
    setAILoading,
    setPreviousContent,
    setAIGeneratedContent,
    setCorrectionCount,
    setCurrentCorrectionIndex,
    setIsCorrectionMode,
    isCorrectionMode,
  } = useEditorToolbarStore();

  // AI 기능 종료 헬퍼 (애니메이션을 위해 상태 초기화 지연)
  const closeAI = useCallback(() => {
    // 1. UI 숨김 처리 (투명도 조절로 페이드 아웃 효과)
    setAIGeneratedContent(false);
    setIsCorrectionMode(false);

    // 2. 애니메이션 종료 후(약 200ms) 상태 초기화
    // 페이드 아웃 효과가 진행되는 동안 UI 내용이 변경되는 것을 방지
    setTimeout(() => {
      setCorrectionCount(0);
      setCurrentCorrectionIndex(0);
    }, 200);
  }, [setAIGeneratedContent, setIsCorrectionMode, setPreviousContent, setCorrectionCount, setCurrentCorrectionIndex]);

  // AI 기능 시작 시 이전 내용 저장
  const handleAIStart = useCallback((message?: string) => {
    if (editor) {
      const currentContent = editor.getHTML();
      setPreviousContent(currentContent);
      setAILoading(true, message || "AI가 내용을 생성하고 있습니다...");
      setCorrectionCount(0);
      setCurrentCorrectionIndex(0);
      setIsCorrectionMode(false);
    }
  }, [editor, setPreviousContent, setAILoading, setCorrectionCount, setCurrentCorrectionIndex, setIsCorrectionMode]);

  // AI 기능 완료 처리
  const handleAIComplete = useCallback(() => {
    setAILoading(false);
    setAIGeneratedContent(true);
  }, [setAILoading, setAIGeneratedContent]);

  // AI 기능 실패 처리
  const handleAIFailed = useCallback(() => {
    setAILoading(false);
  }, [setAILoading]);

  // --- AI Logic ---
  // 실제 에디터 내의 오타(aiInsert) 노드 개수 계산
  const countCorrectionNodes = useCallback(() => {
    if (!editor) return 0;
    let count = 0;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'aiInsert') {
        count++;
      }
    });
    return count;
  }, [editor]);

  // 하이라이트 업데이트 (insert 노드에만 효과 적용)
  const updateActiveCorrectionHighlight = useCallback((activeIndex: number) => {
    if (!editor) return;

    // 트랜잭션으로 한 번에 업데이트
    const { tr } = editor.state;
    let matchIndex = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'aiInsert') {
        // 현재 노드의 active 상태 확인
        const isActive = node.attrs.isActive;
        const shouldBeActive = matchIndex === activeIndex;

        if (isActive !== shouldBeActive) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            isActive: shouldBeActive
          });
        }
        matchIndex++;
      }
    });

    if (tr.docChanged) {
      editor.view.dispatch(tr);
    }
  }, [editor]);

  // 특정 오타 위치로 스크롤 및 선택
  const scrollToCorrection = useCallback((index: number) => {
    if (!editor) return;

    // 시각적 하이라이트 업데이트 (DOM 업데이트 유발)
    updateActiveCorrectionHighlight(index);

    let matchIndex = 0;
    let foundPos = -1;
    let foundNode = null;

    // 오타 위치 찾기 (aiInsert 기준)
    editor.state.doc.descendants((node, pos) => {
      if (foundPos !== -1) return false;
      if (node.type.name === 'aiInsert') {
        if (matchIndex === index) {
          foundPos = pos;
          foundNode = node;
        }
        matchIndex++;
      }
    });

    if (foundPos !== -1) {
      editor.commands.setTextSelection(foundPos);

      // DOM 요소를 찾아 중앙 정렬 스크롤 시도
      // React 및 ProseMirror 렌더링 타이밍을 고려하여 지연 스크롤 실행
      setTimeout(() => {
        try {
          // `nodeDOM`은 해당 위치(pos)의 DOM 노드를 반환합니다.
          // 커스텀 노드(inline, atom)의 경우 래퍼 엘리먼트일 수 있습니다.
          const dom = editor.view.nodeDOM(foundPos) as HTMLElement;
          if (dom) {
            dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // nodeDOM 변경 실패 시 예외 처리 (텍스트 노드나 기본 span에서 발생 가능)
            // 엘리먼트를 찾지 못한 경우 기본 스크롤 사용 (중앙 정렬은 지원하지 않음)
            editor.commands.scrollIntoView();
          }
        } catch (e) {
          // 예외 발생 시 기본 스크롤 사용
          editor.commands.scrollIntoView();
        }
      }, 50);
    }
  }, [editor, updateActiveCorrectionHighlight]);

  // 오타 수정 데이터 수신 처리
  const handleCorrectionsFound = useCallback((corrections: any[]) => {
    // API 응답 후 DOM 업데이트 대기
    setTimeout(() => {
      const count = countCorrectionNodes();
      // 동기화 Ref 업데이트
      setIsCorrectionMode(count > 0);
      setCorrectionCount(count);
      setCurrentCorrectionIndex(0);
      // 첫 번째 오타로 이동 및 하이라이트
      if (count > 0) {
        scrollToCorrection(0);
      }
    }, 100);
  }, [countCorrectionNodes, scrollToCorrection, setIsCorrectionMode, setCorrectionCount, setCurrentCorrectionIndex]);

  // 다음 오타로 이동
  const handleNextCorrection = useCallback(() => {
    if (correctionCount === 0) return;
    const nextIndex = (currentCorrectionIndex + 1) % correctionCount;
    setCurrentCorrectionIndex(nextIndex);
    scrollToCorrection(nextIndex);
  }, [correctionCount, currentCorrectionIndex, scrollToCorrection]);

  // 이전 오타로 이동
  const handlePrevCorrection = useCallback(() => {
    if (correctionCount === 0) return;
    const prevIndex = (currentCorrectionIndex - 1 + correctionCount) % correctionCount;
    setCurrentCorrectionIndex(prevIndex);
    scrollToCorrection(prevIndex);
  }, [correctionCount, currentCorrectionIndex, scrollToCorrection]);

  // 현재 오타 하나만 적용
  const handleApplySingleCorrection = useCallback(() => {
    if (!editor) return;

    let matchIndex = 0;
    let targetPos = -1;
    let insertText = "";

    editor.state.doc.descendants((node, pos) => {
      if (targetPos !== -1) return false;
      if (node.type.name === 'aiDelete') {
        if (matchIndex === currentCorrectionIndex) {
          targetPos = pos;
          insertText = node.attrs.insert;
        }
        matchIndex++;
      }
    });

    if (targetPos !== -1) {
      const deleteNodeSize = editor.state.doc.nodeAt(targetPos)?.nodeSize || 0;
      const insertNodePos = targetPos + deleteNodeSize;
      const insertNode = editor.state.doc.nodeAt(insertNodePos);
      const insertNodeSize = insertNode?.nodeSize || 0;

      if (deleteNodeSize > 0 && insertNode) {
        editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) {
            tr.replaceWith(targetPos, targetPos + deleteNodeSize + insertNodeSize, editor.schema.text(insertText));

            // 커서 위치 조정
            const SelectionClass = editor.state.selection.constructor as any;
            if (SelectionClass.near) {
              tr.setSelection(SelectionClass.near(tr.doc.resolve(targetPos + insertText.length)));
            }
          }
          return true;
        });

        // 참고: handleEditorUpdate가 차단될 경우 상태 업데이트가 보장되지 않을 수 있으므로,
        // 이곳에서 수동으로 카운트와 인덱스를 업데이트합니다.
        // 노드를 교체하면 전체 카운트가 감소하므로 재계산이 필요합니다.
        setTimeout(() => {
          const newCount = countCorrectionNodes();
          setIsCorrectionMode(newCount > 0);
          setCorrectionCount(newCount);
          if (currentCorrectionIndex >= newCount) {
            // 마지막 항목이었다면 이전 항목으로 이동
            const newIndex = Math.max(0, newCount - 1);
            setCurrentCorrectionIndex(newIndex);
            if (newCount > 0) scrollToCorrection(newIndex);
          } else {
            // 현재 인덱스 유지 (다음 항목이 현재 위치로 이동됨)
            if (newCount > 0) scrollToCorrection(currentCorrectionIndex);
          }

          if (newCount === 0) {
            // 모든 수정 완료
            closeAI();
          }
        }, 50);
      }
    }
  }, [editor, currentCorrectionIndex, correctionCount, countCorrectionNodes, scrollToCorrection, closeAI]);

  // 현재 오타 취소 (원래대로 되돌리기)
  const handleCancelSingleCorrection = useCallback(() => {
    if (!editor) return;

    let matchIndex = 0;
    let targetPos = -1;
    let originalText = "";

    editor.state.doc.descendants((node, pos) => {
      if (targetPos !== -1) return false;
      if (node.type.name === 'aiDelete') {
        if (matchIndex === currentCorrectionIndex) {
          targetPos = pos;
          originalText = node.attrs.text;
        }
        matchIndex++;
      }
    });

    if (targetPos !== -1) {
      const deleteNodeSize = editor.state.doc.nodeAt(targetPos)?.nodeSize || 0;
      const insertNodePos = targetPos + deleteNodeSize;
      const insertNode = editor.state.doc.nodeAt(insertNodePos);
      const insertNodeSize = insertNode?.nodeSize || 0;

      if (deleteNodeSize > 0 && insertNode) {
        editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) {
            // 원래 텍스트로 대체
            tr.replaceWith(targetPos, targetPos + deleteNodeSize + insertNodeSize, editor.schema.text(originalText));

            // 커서 위치 조정
            const SelectionClass = editor.state.selection.constructor as any;
            if (SelectionClass.near) {
              tr.setSelection(SelectionClass.near(tr.doc.resolve(targetPos + originalText.length)));
            }
          }
          return true;
        });

        // 상태 업데이트
        setTimeout(() => {
          const newCount = countCorrectionNodes();
          setIsCorrectionMode(newCount > 0);
          setCorrectionCount(newCount);
          if (currentCorrectionIndex >= newCount) {
            const newIndex = Math.max(0, newCount - 1);
            setCurrentCorrectionIndex(newIndex);
            if (newCount > 0) scrollToCorrection(newIndex);
          } else {
            if (newCount > 0) scrollToCorrection(currentCorrectionIndex);
          }

          if (newCount === 0) {
            // 모든 수정 완료
            closeAI();
          }
        }, 50);
      }
    }
  }, [editor, currentCorrectionIndex, correctionCount, countCorrectionNodes, scrollToCorrection, closeAI]);

  // AI 생성 내용 복원
  const handleRestoreContent = useCallback(() => {
    if (editor && previousContent) {
      const contentToRestore = previousContent;
      // 1. 에디터 내용 먼저 복원
      editor.commands.setContent(contentToRestore);
      // 2. 그 후 AI 모드 종료 (상태 변경)
      closeAI();
    }
  }, [editor, previousContent, closeAI]);

  // AI 변경사항 적용 (전체 적용)
  const handleApplyContent = useCallback(() => {
    if (editor) {
      // 1. 적용될 HTML 계산
      const appliedContent = getAppliedHTML(editor);
      // 2. 에디터 내용 업데이트
      editor.commands.setContent(appliedContent);
      // 3. AI 모드 종료
      closeAI();
    }
  }, [editor, closeAI]);

  // --- Effects ---
  // ESC 및 Enter 키 이벤트 리스너 추가
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasAIGeneratedContent) return;

      // input이나 textarea에서 입력 중인 경우는 제외 (단, 에디터 자체는 제외)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // 만약 에디터가 read-only인 상태에서 focus가 에디터에 있다면 target.isContentEditable은 false일 것임.
      // 하지만 에디터 외의 다른 입력창(제목 등)에서 엔터를 누르는 것은 막아야 함.
      if (isInput && !target.closest('.ProseMirror')) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleRestoreContent();
      } else if (event.key === "Enter") {
        // IME(한글 입력 등) 중인 경우 무시
        if (event.isComposing) return;

        event.preventDefault();
        handleApplyContent();
      }
    };

    if (hasAIGeneratedContent) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [hasAIGeneratedContent, handleRestoreContent, handleApplyContent]);

  // AI 생성 내용 상태 관리 및 에디터 내용 변경 감지
  useEffect(() => {
    if (!editor) return;

    const handleEditorUpdate = () => {
      // 에디터 내용 변경 시 오타 수정 노드가 남아있는지 확인
      let hasAINodes = false;
      editor.state.doc.descendants((node) => {
        if (hasAINodes) return false;
        if (node.type.name === 'aiInsert' || node.type.name === 'aiDelete') {
          hasAINodes = true;
        }
      });

      if (hasAINodes) {
        // 오타 수정 노드가 발견되면 툴바 활성화 (이미 활성화된 경우 제외)
        if (!hasAIGeneratedContent) {
          setAIGeneratedContent(true);
          setIsCorrectionMode(true);
          // 발견 즉시 카운트 업데이트
          const count = countCorrectionNodes();
          setCorrectionCount(count);
          setCurrentCorrectionIndex(0);
        } else {
          // 이미 활성화된 상태라면 카운트만 동기화
          const count = countCorrectionNodes();
          if (count !== correctionCount) {
            setCorrectionCount(count);
            if (count > 0 && currentCorrectionIndex >= count) {
              setCurrentCorrectionIndex(0);
            }
            // 만약 카운트가 0이 되었다면 (동기화 이슈로 인해) 닫아야 함
            if (count === 0) {
              closeAI();
            }
          }
        }
      } else if (isCorrectionMode) {
        // 오타 수정 노드가 없는데 오타 수정 모드인 경우 툴바 닫기
        // (사용자가 수동으로 모두 지웠거나 적용/취소한 경우)
        if (hasAIGeneratedContent) {
          closeAI();
        }
      }
    };

    editor.on("update", handleEditorUpdate);

    return () => {
      editor.off("update", handleEditorUpdate);
    };
  }, [editor, hasAIGeneratedContent, isCorrectionMode, correctionCount, currentCorrectionIndex, countCorrectionNodes, closeAI, setAIGeneratedContent, setIsCorrectionMode, setCorrectionCount, setCurrentCorrectionIndex]);

  return {
    isAILoading,
    hasAIGeneratedContent,
    aiLoadingMessage,
    correctionCount,
    currentCorrectionIndex,
    handleAIStart,
    handleAIComplete,
    handleAIFailed,
    handleCorrectionsFound,
    handleNextCorrection,
    handlePrevCorrection,
    handleApplySingleCorrection,
    handleCancelSingleCorrection,
    handleRestoreContent,
    handleApplyContent
  };
};
