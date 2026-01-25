import { Hash, FileText, Clock, Trash2, X } from "lucide-react";
import { useAutocomplete } from "@hooks/useAutocomplete";
import { getHighlightTokens } from "@utils/searchHighlightUtils";
import { useMemoStore } from "@store/memoStore";
import { useAutocompleteStore } from "@store/autocompleteStore";
import { useSearchParams, useRouter } from 'next/navigation';

interface AutocompleteItem {
  text: string;
  type: string;
}

export function AutocompleteDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSearchTerm } = useMemoStore();

  const {
    localSearchTerm,
    showSuggestions,
    selectedIndex,
    searchHistory,
    handleSelectSuggestion,
    removeSearchHistoryItem,
    clearSearchHistory
  } = useAutocompleteStore();

  const { suggestions: autocompleteSuggestions = [] } = useAutocomplete(localSearchTerm) as { suggestions: AutocompleteItem[] };

  const isShowDropdown = (showSuggestions && (autocompleteSuggestions.length > 0 || searchHistory.length > 0));

  return (
    <div className={`absolute right-0 bottom-full py-2 mb-2 w-full bg-inverse/60 backdrop-blur-3xl border border-muted-foreground/30 rounded-2xl shadow-2xl/10 overflow-hidden transition-all ${isShowDropdown ? '' : 'pointer-events-none opacity-0 translate-y-2.5'}`}>
      {searchHistory.length > 0 && (
        <div>
          <div className="px-4 py-1.5 flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider">
            <span>최근 검색어</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSearchHistory();
              }}
              className="ml-auto p-2 -m-1.5 rounded-full hover:bg-muted-foreground/5 hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {searchHistory.slice(0, 3).map((historyItem, idx) => (
            <div
              key={`history-${idx}`}
              onClick={() => {
                handleSelectSuggestion(historyItem);
                setSearchTerm(historyItem);

                // URL 파라미터 업데이트
                const params = new URLSearchParams(searchParams);
                params.set('search', historyItem);
                router.push(`?${params.toString()}`);
              }}
              className={`flex items-center gap-3 px-4 py-1.5 flex-1 cursor-pointer ${selectedIndex === idx ? 'bg-muted-foreground/10' : 'hover:bg-muted-foreground/6'}`}
            >
              <Clock className="h-4 w-4 opacity-50" />
              <span className="text-sm font-medium">
                {getHighlightTokens(historyItem, localSearchTerm).map((token, tokenIdx) =>
                  token.isHighlighted ? (
                    <mark key={tokenIdx} className="text-yellow-700 dark:text-yellow-200 bg-transparent">
                      {token.text}
                    </mark>
                  ) : (
                    <span key={tokenIdx}>{token.text}</span>
                  )
                )}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearchHistoryItem(historyItem);
                }}
                className="p-1 -m-0.5 ml-auto text-muted-foreground/50 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {(searchHistory.length > 0 && autocompleteSuggestions.length > 0) && <div className="w-full h-px bg-border/70 mb-2 mt-2" />}
      {autocompleteSuggestions.length > 0 && (
        <div>
          <div className="px-4 py-1.5 text-xs text-muted-foreground uppercase tracking-wider">
            추천 검색어
          </div>
          {autocompleteSuggestions.map((item, idx) => (
            <div
              key={`suggestion-${idx}`}
              onClick={() => {
                handleSelectSuggestion(item.text);
                setSearchTerm(item.text);

                // URL 파라미터 업데이트
                const params = new URLSearchParams(searchParams);
                params.set('search', item.text);
                router.push(`?${params.toString()}`);
              }}
              className={`flex items-center gap-3 px-4 py-1.5 cursor-pointer ${selectedIndex === (searchHistory.length + idx) ? 'bg-muted-foreground/10' : 'hover:bg-muted-foreground/6'}`}
            >
              {item.type === 'tag' ? <Hash className="h-4 w-4 opacity-50" /> : <FileText className="h-4 w-4 opacity-50" />}
              <span className="text-sm font-medium">
                {getHighlightTokens(item.text, localSearchTerm).map((token, tokenIdx) =>
                  token.isHighlighted ? (
                    <mark key={tokenIdx} className="text-yellow-700 dark:text-yellow-200 bg-transparent">
                      {token.text}
                    </mark>
                  ) : (
                    <span key={tokenIdx}>{token.text}</span>
                  )
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}