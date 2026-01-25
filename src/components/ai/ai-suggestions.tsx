"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Memo as MemoType } from '@/types'; // 타입 가져오기

type Memo = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
};

type AISuggestion = {
  id: string;
  type: "classification" | "connection" | "summary";
  title: string;
  description: string;
};

export function AISuggestions({ memos }: { memos: MemoType[] }) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 메모 분석 및 제안 생성 (시뮬레이션)
  const generateSuggestions = async () => {
    setIsLoading(true);

    // 실제 구현에서는 여기에 AI API 호출 로직이 들어갑니다.
    // 현재는 시뮬레이션으로 구현
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockSuggestions: AISuggestion[] = [
      {
        id: "1",
        type: "classification",
        title: "프로젝트 관련 메모 분류",
        description: "5개의 메모가 프로젝트 관련 내용으로 보입니다. '프로젝트' 폴더를 만들어 분류하시겠습니까?"
      },
      {
        id: "2",
        type: "connection",
        title: "연관된 메모 발견",
        description: "메모 '회의록 1'과 '회의록 2'가 유사한 내용을 포함하고 있습니다. 연결하시겠습니까?"
      },
      {
        id: "3",
        type: "summary",
        title: "요약 생성",
        description: "최근 3개의 메모를 기반으로 요약을 생성해드릴까요?"
      }
    ];

    setSuggestions(mockSuggestions);
    setIsLoading(false);
  };

  useEffect(() => {
    // 메모가 변경될 때마다 새로운 제안 생성
    if (memos.length > 0) {
      generateSuggestions();
    }
  }, [memos]);

  const handleSuggestionAction = (suggestion: AISuggestion) => {
    // 실제 구현에서는 여기에 각 제안에 대한 처리 로직이 들어갑니다.
    alert(`${suggestion.title} 제안이 실행됩니다.`);
  };

  if (memos.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border mt-4 px-3 pb-2 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center text-foreground">
          <Sparkles className="w-4 h-4 mr-2" />
          AI 제안
        </h3>
        <button
          onClick={generateSuggestions}
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {isLoading ? "생성 중..." : "새로고침"}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <p className="text-xs text-muted-foreground mt-2">AI 제안을 생성 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 rounded-md border border-border bg-card hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleSuggestionAction(suggestion)}
            >
              <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
              <div className="mt-2 flex justify-end">
                <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                  {suggestion.type === "classification" && "분류"}
                  {suggestion.type === "connection" && "연결"}
                  {suggestion.type === "summary" && "요약"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}