import { CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHomeFilterStore } from "@store/homeFilterStore";
import { useMemoStore } from "@store/memoStore";

interface SortDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; right: number };
}

export function SortDropdown({ isOpen, onClose, position }: SortDropdownProps) {
  const { searchTerm } = useMemoStore();
  const { filterOptions, updateFilterOptions } = useHomeFilterStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleSortChange = (sortBy: 'updatedAt' | 'createdAt' | 'title' | 'relevance') => {
    updateFilterOptions({ sortBy });
    onClose();
  };

  const dropdownElement = (
    <div className={`fixed inset-0 flex items-center justify-center z-100 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div
        ref={dropdownRef}
        className={`fixed z-50 py-2.5 px-2 mt-1 bg-background text-popover-foreground rounded-2xl shadow-xl border border-border overflow-hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          top: position?.top,
          right: position?.right,
        }}
      >
        <div className="space-y-1">
          <div
            className={`flex items-center pl-3 pr-8 py-2 rounded-lg text-sm cursor-pointer whitespace-nowrap ${filterOptions.sortBy === 'updatedAt'
              ? "bg-primary text-primary-foreground"
              : "text-popover-foreground hover:bg-foreground/5"
              }`}
            onClick={() => handleSortChange('updatedAt')}
          >
            수정일순
          </div>
          <div
            className={`flex items-center pl-3 pr-8 py-2 rounded-lg text-sm cursor-pointer whitespace-nowrap ${filterOptions.sortBy === 'createdAt'
              ? "bg-primary text-primary-foreground"
              : "text-popover-foreground hover:bg-foreground/5"
              }`}
            onClick={() => handleSortChange('createdAt')}
          >
            생성일순
          </div>
          <div
            className={`flex items-center pl-3 pr-8 py-2 rounded-lg text-sm cursor-pointer whitespace-nowrap ${filterOptions.sortBy === 'title'
              ? "bg-primary text-primary-foreground"
              : "text-popover-foreground hover:bg-foreground/5"
              }`}
            onClick={() => handleSortChange('title')}
          >
            제목순
          </div>
          {searchTerm &&
            <div
              className={`flex items-center pl-3 pr-8 py-2 rounded-lg text-sm cursor-pointer whitespace-nowrap ${filterOptions.sortBy === 'relevance'
                ? "bg-primary text-primary-foreground"
                : "text-popover-foreground hover:bg-foreground/5"
                }`}
              onClick={() => handleSortChange('relevance')}
            >
              정확도순
            </div>}
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined' || !mounted) {
    return null;
  }

  return createPortal(dropdownElement, document.body);
}