import { Search, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useMemoBrowserStore } from "@/store/memoBrowserStore";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export const SearchInput = forwardRef<{ focus: () => void }, SearchInputProps>(({
  placeholder = "메모 검색...",
  className = "",
}, ref) => {
  const { searchTerm, handleSearchChange, clearSearch } = useSearch();
  const { isSearchFocused, setIsSearchFocused } = useMemoBrowserStore();

  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleFocus = () => {
    setIsSearchFocused(true);
  };

  const handleBlur = () => {
    setIsSearchFocused(false);
  };

  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  // ESC 키를 누르면 검색창에서 포커스 해제
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.25 -my-1 text-base rounded-lg border border-input-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {searchTerm && isSearchFocused && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-full hover:bg-muted-foreground/10 text-muted-foreground"
          aria-label="검색어 지우기"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = "SearchInput";