import { useSocketContext } from "@/contexts/SocketContext";
import { useCurrentCursor } from "@/hooks/useCurrentCursor";
import { useEditorSave } from "@/hooks/useEditorSave";
import { useMemo } from "@/hooks/useMemo";
import { useMemoCacheUpdate } from "@/hooks/useMemoCacheUpdate";
import { useEditorSaveStore } from "@/store/editorSaveStore";
import { useEditorStore } from "@/store/editorStore";
import { useEditorToolbarStore } from "@/store/editorToolbarStore";
import { Memo } from "@/types";
import { getCleanHTMLForSave, getEditorExtensions } from "@/utils/editorExtensions";
import { turndownService } from "@/utils/markdown";
import { autoSaveTimeout } from "@constants/save";
import { useQueryClient } from "@tanstack/react-query";
import { useEditor } from "@tiptap/react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const useEditorHook = () => {
  const queryClient = useQueryClient();
  const {
    setUnsavedChanges,
    hasAIGeneratedContent,
    isCorrectionMode,
    isAILoading,
  } = useEditorToolbarStore();
  const { isEditorReady } = useEditorStore();
  const { data: memoData, isLoading: isMemoLoading, isRefetching, isCurrentMemoOwner } = useMemo();
  const { updateMemoInCache } = useMemoCacheUpdate();
  const searchParams = useSearchParams();
  const params = useParams();
  const currentMemoId = memoData?.id || searchParams.get('id') || params.id as string;

  const {
    triggerAutoSave,
    isCurrentMemoSaving,
    updateHasUnsavedChanges,
  } = useEditorSave();

  const {
    isMarkdownMode,
    markdownContent,
    setIsMarkdownMode,
    setMarkdownContent,
    setCurrentMemoId,
    setLastSaved,
    prevMemoIdRef,
    isInitializingRef,
    initialTitleRef,
    initialContentRef,
    saveTimeoutRef,
    isUpdatingFromSocket,
  } = useEditorSaveStore();

  const {
    title,
    setTitle,
    liveSharePermission,
    setLiveSharePermission,
    editorContainerRef,
    setAllowedUsers,
    setCurrentEditor,
  } = useEditorStore();

  const {
    socket,
    effectiveIsConnected,
    isConnected,
    sendMemoContentChange,
    sendCursorMove,
    on,
    off
  } = useSocketContext();

  const {
    focusIndicatorPosition,
    updateFocusIndicatorPosition,
    handleEditorFocus,
    handleEditorBlur
  } = useCurrentCursor();

  // AI 상태 변화를 추적하기 위한 ref
  const prevAIActiveRef = useRef(false);
  const currentAIActive = isAILoading || hasAIGeneratedContent || isCorrectionMode;

  // 메모 변경 시 에디터 재생성
  const editor = useEditor({
    immediatelyRender: true,
    extensions: getEditorExtensions(),
    content: memoData?.content,
    autofocus: (isConnected || isRefetching) ? false : 'start',
    editable: isEditorReady && (isCurrentMemoOwner || (isConnected && memoData?.isLiveShareEnabled && liveSharePermission === "readWrite")) && !(isAILoading || hasAIGeneratedContent) && !isRefetching,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: (content) => {
      if (isEditorReady) {
        // 소켓 업데이트가 아닌 경우에만 변경사항 여부, 커서 업데이트
        if (!isUpdatingFromSocket.current) {
          updateHasUnsavedChanges();
          updateFocusIndicatorPosition();
        }

        // 현재 메모 ID가 있고 초기화 중이 아니며 자동저장이 활성화된 경우에만 자동 저장 트리거
        if (currentMemoId && !isInitializingRef.current) {
          const content = isMarkdownMode ? markdownContent : (editor?.getHTML() || "");

          // 소켓을 통해 다른 사용자들에게 변경 내용 전송 (소켓 업데이트가 아닌 경우에만)
          if (effectiveIsConnected && currentMemoId && !isUpdatingFromSocket.current && content !== initialContentRef.current) {
            // 내용 수정 이벤트 전송 (캐럿 위치 포함)
            sendMemoContentChange({
              memoId: currentMemoId,
              content,
              title,
              cursorPosition: focusIndicatorPosition
            });
          }

          // 자동 저장은 소켓 업데이트가 아닌 경우에만 실행
          if (!isUpdatingFromSocket.current) {
            // 내용이 실제로 변경된 경우에만 자동 저장 트리거
            let currentContent = isMarkdownMode ? markdownContent : (editor ? getCleanHTMLForSave(editor) : "");

            // AI 제안 모드이거나 AI가 생성 중인 경우 제안된 내용은 저장하지 않고 초기 내용을 유지하여 자동저장 방지
            // stale closure 방지를 위해 store에서 직접 최신 상태 가져오기
            if (isAILoading || (hasAIGeneratedContent && !isCorrectionMode)) {
              currentContent = initialContentRef.current || "";
            }

            if (initialContentRef.current !== currentContent) {
              // 자동 저장을 즉시 트리거하지 않고 디바운싱 적용
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }

              console.log('자동 저장 트리거:', initialContentRef.current);
              console.log(currentContent)
              saveTimeoutRef.current = setTimeout(() => {
                (isCurrentMemoOwner || isConnected) && triggerAutoSave(title, currentContent);
              }, autoSaveTimeout);
            }
          }
        }

        // 플래그 리셋
        isUpdatingFromSocket.current = false;
      }
    },
    onFocus: () => {
      // 에디터가 포커스를 받을 때 위치 업데이트
      handleEditorFocus();
    },
    onBlur: () => {
      // 에디터가 포커스를 잃을 때 커서 위치 제거
      handleEditorBlur();
    },
  }, [memoData?.id, isEditorReady]);


  useEffect(() => {
    if (editor) {
      setCurrentEditor(editor);
    }
  }, [editor]);

  // 메모 링크 클릭 이벤트 리스너
  useEffect(() => {
    const handleMemoLinkClick = (event: CustomEvent) => {
      const { memoId } = event.detail;
      if (memoId) {
        // URL 변경으로 메모 이동 (id만 변경, 다른 파라미터들은 유지)
        const url = new URL(window.location.href);
        url.searchParams.set('id', memoId);
        window.history.pushState({}, '', url.toString());
      }
    };

    window.addEventListener('memoLinkClick', handleMemoLinkClick as EventListener);

    return () => {
      window.removeEventListener('memoLinkClick', handleMemoLinkClick as EventListener);
    };
  }, []);

  // 소켓 이벤트 리스너 등록
  useEffect(() => {
    if (!editor) return;

    // 서버로부터 메모 내용 변경 이벤트 수신
    const handleMemoContentUpdate = (data: {
      content: string;
      title: string;
      memoId: string;
      userSocketId: string;
      userId: string;
      cursorPosition?: any
    }) => {
      // 다른 사용자가 내용을 변경한 경우에만 적용 (자신의 변경사항은 이미 반영됨)
      // 또는 자신이 변경했더라도 다른 기기/탭에서 변경한 경우 반영
      if (data.memoId === currentMemoId && data.userSocketId !== socket?.id) {
        console.log('메모 내용 변경 수신:', data);

        // 소켓 업데이트 중임을 표시하여 selectionUpdate 이벤트 루프 방지
        isUpdatingFromSocket.current = true;

        // 제목 업데이트
        if (data.title !== title) {
          setTitle(data.title);
          initialTitleRef.current = data.title;
        }

        // 내용 업데이트
        if (editor) {
          // 현재 커서 위치와 스크롤 위치 저장
          const { selection } = editor.state;
          const { from, to } = selection;
          // const scrollPos = editor.view.dom.scrollTop; // TipTap에서 스크롤 제어는 복잡함

          // 에디터 내용 업데이트 (history 보존 옵션 확인 필요)
          // preserveWhitespace: 'full'은 마크다운/코드 블록 공백 보존에 중요
          const currentContent = editor.getHTML();
          if (currentContent !== data.content) {
            editor.commands.setContent(data.content, { emitUpdate: false, parseOptions: { preserveWhitespace: 'full' } });

            // 커서 위치 복원 시도 (내용이 변경되어 정확한 위치가 아닐 수 있음)
            // 너무 큰 변경이면 커서를 유지하는 것이 오히려 이상할 수 있음
            // 안전한 범위 내에서 복원
            const docSize = editor.state.doc.content.size;
            if (from <= docSize && to <= docSize) {
              try {
                editor.commands.setTextSelection({ from, to });
              } catch (e) {
                console.warn('커서 위치 복원 실패:', e);
              }
            }
          }
        }

        // 업데이트 플래그 해제
        setTimeout(() => {
          isUpdatingFromSocket.current = false;
        }, 100);
      }
    };

    // Live Share 종료 이벤트 수신
    const handleLiveShareDisabled = (data: { memoId: string }) => {
      console.log('Live Share가 종료되었습니다', data);

      // React Query 캐시 업데이트
      queryClient.setQueriesData(
        { queryKey: ['memos'] },
        (oldMemos: Memo[] | undefined) => {
          if (!oldMemos) return oldMemos;
          const newData = oldMemos.map(memo =>
            memo.id === currentMemoId ? { ...memo, isLiveShareEnabled: false } : memo
          );

          // Return existing array if all memos are identical
          if (newData.every((memo, index) => memo === oldMemos[index])) {
            return oldMemos;
          }
          return newData;
        }
      );

      queryClient.setQueryData(['memo', memoData?.id || ''], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, isLiveShareEnabled: false };
      });

      // 소켓 연결 해제
      if (socket) {
        socket.disconnect();
      }
    };

    // Live Share 권한 변경 이벤트 수신
    const handleLiveShareSettingsChanged = (data: {
      [x: string]: any;
      memoId: string;
      isLiveShareEnabled?: boolean;
      liveShareMode?: "public" | "private";
      allowedUsers?: string[];
      liveSharePermission?: "readOnly" | "readWrite"
    }) => {
      console.log('Live Share 설정이 변경되었습니다.');
      if (data.memoId === currentMemoId) {
        // React Query 캐시 업데이트
        queryClient.setQueryData(['memo', data.memoId], (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            ...data.settings,
          };
        });

        // Live Share 권한 상태 업데이트
        if (data.liveSharePermission !== undefined || (data.settings && data.settings.liveSharePermission !== undefined)) {
          const newPermission = data.liveSharePermission || (data.settings && data.settings.liveSharePermission);
          setLiveSharePermission(newPermission);

          // 권한이 읽기 전용으로 변경되었고 소유자가 아닌 경우, 대기 중인 자동 저장 취소
          if (newPermission === 'readOnly' && !isCurrentMemoOwner) {
            console.log('읽기 전용 권한으로 변경됨: 대기 중인 저장 취소');
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = null;
            }
            // 대기열도 비우기 (useEditorSaveStore는 훅 내부에서 사용 중이므로 직접 접근 가능할 수도 있으나,
            // 여기서는 ref가 useEditorSaveStore에서 왔으므로 store의 state를 직접 조작하기보다
            // pendingSaveRequests가 useEditorSaveStore의 state가 아니라 ref라면..
            // useEditorSaveStore를 getState로 가져와서 처리)
            const { pendingSaveRequests } = useEditorSaveStore.getState();
            if (pendingSaveRequests.current) {
              pendingSaveRequests.current.clear();
            }
          }

          // 권한 변경 시 에디터의 editable 상태를 다시 계산하여 업데이트
          if (editor) {
            const isPermissionBasedEditable = isCurrentMemoOwner ||
              (effectiveIsConnected && memoData?.isLiveShareEnabled && newPermission === "readWrite");

            const shouldBeEditable = isPermissionBasedEditable && !(hasAIGeneratedContent || isAILoading);
            editor.setEditable(shouldBeEditable);
          }
        }
      }
    };

    // Live Share가 활성화된 경우에만 소켓 이벤트 리스너 등록
    if (memoData?.isLiveShareEnabled) {
      on('memo-content-update', handleMemoContentUpdate);
      on('live-share-disabled', handleLiveShareDisabled); // Live Share 종료 이벤트 리스너 등록
      on('live-share-settings-changed', handleLiveShareSettingsChanged); // Live Share 권한 변경 이벤트 리스너 등록
    }

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      off('memo-content-update', handleMemoContentUpdate);
      off('live-share-disabled', handleLiveShareDisabled); // Live Share 종료 이벤트 리스너 제거
      off('live-share-settings-changed', handleLiveShareSettingsChanged); // Live Share 권한 변경 이벤트 리스너 제거
    };
  }, [editor, currentMemoId, isMarkdownMode, isInitializingRef, setTitle, title, initialContentRef, initialTitleRef, socket?.id, focusIndicatorPosition, sendCursorMove, memoData?.isLiveShareEnabled]);


  // 에디터의 selection이 변경될 때마다 위치 업데이트 (소켓 업데이트가 아닌 경우에만)
  useEffect(() => {
    if (editor) {
      const handleSelectionUpdate = () => {
        if (!isUpdatingFromSocket.current) {
          updateFocusIndicatorPosition();
        }
      };

      editor.on('selectionUpdate', handleSelectionUpdate);

      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        editor.off('selectionUpdate', handleSelectionUpdate);
      };
    }
  }, [editor, updateFocusIndicatorPosition]);

  // URL 쿼리 파라미터에서 메모 ID를 읽어 선택된 메모를 설정
  useEffect(() => {
    const handleMemoChange = async () => {
      // memoData 변경되었을 때 currentMemoId와 title/content 업데이트
      if (memoData && prevMemoIdRef.current !== memoData.id) {
        // 다른 메모로 전환하기 전에 현재 메모 저장 (변경된 내용이 있는 경우에만)
        // 백그라운드로 저장 실행 (await하지 않음)

        // 기존의 자동 저장 타이머 취소
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        prevMemoIdRef.current = memoData.id;
        isInitializingRef.current = true; // 초기화 시작

        setTitle(memoData.title);
        setLastSaved(new Date(memoData.updatedAt));
        setCurrentMemoId(memoData.id);
        initialTitleRef.current = memoData.title; // 초기 제목 저장

        if (editor) {
          // 소켓 업데이트가 아닌 경우에만 내용 설정
          if (!isUpdatingFromSocket.current) {
            editor.commands.setContent(memoData.content, { parseOptions: { preserveWhitespace: 'full' } });
          }
          initialContentRef.current = memoData.content; // 초기 내용 저장
        }

        // 변경사항 여부 업데이트
        updateHasUnsavedChanges();

        // 초기화 완료 후 auto-save 활성화
        setTimeout(() => {
          isInitializingRef.current = false;
        }, 100);
      } else if (!memoData && prevMemoIdRef.current !== null) {
        // memoData 없고 이전에 메모가 있었다면 에디터 초기화
        // 다른 메모로 전환하기 전에 현재 메모 저장 (변경된 내용이 있는 경우에만)

        // 기존의 자동 저장 타이머 취소
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        prevMemoIdRef.current = null;
        setTitle("");
        initialTitleRef.current = "";
        setMarkdownContent("");
        setCurrentMemoId(null);

        if (editor) {
          editor.commands.clearContent();
          initialContentRef.current = "";
        }

        // 초기화 완료 후 auto-save 활성화
        isInitializingRef.current = false;
      }
    };

    handleMemoChange();
  }, [memoData?.id]);

  // memoData가 변경될 때 에디터 업데이트
  useEffect(() => {
    // 자동 저장 중이거나 자동 저장 직후에는 에디터 내용을 업데이트하지 않음
    if (memoData && !isMemoLoading && !isCurrentMemoSaving()) {
      // 현재 보고 있는 메모와 업데이트되는 메모가 같은 경우에만 업데이트
      if (currentMemoId === memoData.id) {
        // 제목 업데이트 (자동저장으로 인한 변경은 제외)
        // 사용자가 직접 제목을 수정하지 않았을 경우에만 업데이트
        if (title === initialTitleRef.current && title !== memoData.title) {
          setTitle(memoData.title);
          initialTitleRef.current = memoData.title; // 초기 제목 저장
        }

        // 내용도 업데이트 (자동저장으로 인한 변경은 제외)
        // editor가 존재하고 초기 내용과 다른 경우에만 업데이트
        if (editor && initialContentRef.current !== memoData.content) {
          // 소켓 업데이트가 아닌 경우에만 내용 설정
          if (!isUpdatingFromSocket.current) {
            editor.commands.setContent(memoData.content, { parseOptions: { preserveWhitespace: 'full' } }); // 선택(커서) 유지 옵션 제거
          }
          initialContentRef.current = memoData.content; // 초기 내용 저장
        }

        // 메모의 업데이트 시간을 마지막 업데이트 시간으로 설정
        if (memoData.updatedAt) {
          setLastSaved(new Date(memoData.updatedAt));
        } else if (memoData.createdAt) {
          // updatedAt이 없으면 생성일시를 사용
          setLastSaved(new Date(memoData.createdAt));
        }

      }
    }

    // 변경사항 여부 업데이트
    updateHasUnsavedChanges();
  }, [memoData]);



  // memoData가 변경될 때 Live Share 상태 업데이트
  useEffect(() => {
    if (memoData) {
      setAllowedUsers(memoData.allowedUsers || []);
      setLiveSharePermission((memoData.liveSharePermission as "readOnly" | "readWrite") || "readWrite");
    }
  }, [memoData]);

  // Live Share 권한이 변경될 때 에디터의 editable 속성 업데이트
  useEffect(() => {
    if (editor) {
      // 메모 소유자는 항상 편집 가능, 공유된 메모는 연결 상태와 권한에 따라 편집 가능 여부 결정
      const isPermissionBasedEditable = isCurrentMemoOwner ||
        (effectiveIsConnected && memoData?.isLiveShareEnabled && liveSharePermission === "readWrite");

      // 최종 편집 가능 상태는 권한 기반 상태와 AI 상태를 모두 고려
      const shouldBeEditable = isPermissionBasedEditable && !(hasAIGeneratedContent || isAILoading);
      editor.setEditable(shouldBeEditable);
    }
  }, [editor, isCurrentMemoOwner, effectiveIsConnected, liveSharePermission, memoData?.isLiveShareEnabled, hasAIGeneratedContent, isAILoading]);

  // AI 생성 중이거나 결과가 있을 때 에디터 수정을 비활성화/활성화
  useEffect(() => {
    if (!editor) return;

    // 현재 편집 가능 상태를 계산 (권한 기반 + AI 상태)
    const isPermissionBasedEditable = isCurrentMemoOwner ||
      (effectiveIsConnected && memoData?.isLiveShareEnabled && liveSharePermission === "readWrite");

    // AI 상태에 따라 편집 가능 여부 조정
    const finalEditableState = isPermissionBasedEditable && !(hasAIGeneratedContent || isAILoading);

    editor.setEditable(finalEditableState);
  }, [editor, isCurrentMemoOwner, effectiveIsConnected, liveSharePermission, memoData?.isLiveShareEnabled, hasAIGeneratedContent, isAILoading]);

  // Markdown 모드 토글 함수
  const toggleMarkdownMode = () => {
    if (!isMarkdownMode) {
      // WYSIWYG 모드에서 Markdown 모드로 전환
      if (editor) {
        const htmlContent = editor ? editor.getHTML() : "";

        // Turndown을 사용하여 HTML을 Markdown으로 변환
        try {
          const markdown = turndownService.turndown(htmlContent);
          setMarkdownContent(markdown);
        } catch (error) {
          console.error("Error converting HTML to Markdown:", error);
          // 에러 발생 시 기본 텍스트로 대체
          setMarkdownContent(editor.getText());
        }
      }
    }
    setIsMarkdownMode(!isMarkdownMode);
    // 모드 변경 후에는 auto-save 활성화
    if (!isInitializingRef.current) {
      setTimeout(() => {
        triggerAutoSave(title, isMarkdownMode ? markdownContent : (editor?.getHTML() || ""));
      }, 100);
    }
  };

  // AI 제안 모드 종료 시(적용/취소) 자동 저장 트리거
  useEffect(() => {
    if (!currentMemoId || isInitializingRef.current) return;

    // AI 제안 모드가 종료되는 시점(Active -> Inactive)을 감지
    const wasActive = prevAIActiveRef.current;
    const isNowActive = currentAIActive;
    prevAIActiveRef.current = isNowActive;

    if (wasActive && !isNowActive) {
      const currentContent = isMarkdownMode ? markdownContent : (editor ? getCleanHTMLForSave(editor) : "");

      if (initialContentRef.current !== currentContent && currentContent !== "") {
        console.log('AI 제안 종료 감지: 자동 저장 트리거');

        // UI 즉시 업데이트: "저장 중..." 표시를 위해 강제로 변경사항 상태 TRUE 설정
        setUnsavedChanges(true);

        // AI 정리/복원이 완료된 것이므로 즉시 저장 트리거 (디바운싱 없이)
        (isCurrentMemoOwner || isConnected) && triggerAutoSave(title, currentContent);

        // 캐시도 업데이트
        if (memoData) {
          updateMemoInCache({ ...memoData, title, content: currentContent });
        }
      }
    }
  }, [currentAIActive, currentMemoId, title, isMarkdownMode, markdownContent, editor, isCurrentMemoOwner, isConnected, triggerAutoSave, updateMemoInCache, memoData]);

  // 에디터의 editable 상태가 변경되었을 때 툴바 상태도 함께 업데이트
  useEffect(() => {
    if (editor) {
      // 현재 편집 가능 상태를 계산 (권한 기반 + AI 상태)
      const isPermissionBasedEditable = isCurrentMemoOwner ||
        (effectiveIsConnected && memoData?.isLiveShareEnabled && liveSharePermission === "readWrite");

      // 최종 편집 가능 상태는 권한 기반 상태와 AI 상태를 모두 고려
      const isCurrentlyEditable = isPermissionBasedEditable && !(hasAIGeneratedContent || isAILoading);
    }
  }, [editor, isCurrentMemoOwner, effectiveIsConnected, liveSharePermission, memoData?.isLiveShareEnabled, hasAIGeneratedContent, isAILoading]);

  return {
    editor,
    isMarkdownMode,
    markdownContent,
    triggerAutoSave,
    isCurrentMemoSaving,
    updateHasUnsavedChanges,
    setCurrentMemoId,
    setLastSaved,
    prevMemoIdRef,
    isInitializingRef,
    initialTitleRef,
    initialContentRef,
    saveTimeoutRef,
    isUpdatingFromSocket,
    title,
    setTitle,
    liveSharePermission,
    setLiveSharePermission,
    editorContainerRef,
    setAllowedUsers,
    setCurrentEditor,
    socket,
    effectiveIsConnected,
    isConnected,
    sendMemoContentChange,
    sendCursorMove,
    on,
    off
  }
};

export default useEditorHook;