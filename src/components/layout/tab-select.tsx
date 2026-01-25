"use client";

import { useState, useRef, useEffect } from "react";
import { Archive, Trash2, CloudDownload, History } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';

const TAB_OPTIONS = [
  { value: 'recent', label: '최근 메모', icon: History },
  { value: 'archived', label: '보관함', icon: Archive },
  { value: 'shared', label: '공유된 메모', icon: CloudDownload },
  { value: 'trash', label: '휴지통', icon: Trash2 }
];

export function TabSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [initTabParams, setInitTabParams] = useState<string>();
  const selectRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParams = searchParams.get('tab');

  useEffect(() => {
    if (tabParams) setInitTabParams(tabParams);
  }, [tabParams])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Find the selected option
  const selectedOption = TAB_OPTIONS.find(option => option.value === initTabParams) || TAB_OPTIONS[0];

  // Handle option selection
  const handleSelect = (value: string) => {
    // Update URL with new tab parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);

    router.replace(`/memo?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center h-full z-50" ref={selectRef}>
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Select trigger */}
      <div
        className="h-full"
        onClick={(e) => setIsOpen(!isOpen)}
      >
        <div
          className={`flex items-center justify-between h-full -ml-2 px-2 text-lg font-semibold border-transparent bg-transparent text-foreground cursor-pointer focus:outline-none ${isOpen ? 'border-foreground/10' : 'border-transparent'}`}
        >
          <span className="flex items-center flex-1 mr-2.5">
            {selectedOption.icon && <selectedOption.icon className="w-5 h-5 mr-2.5" />}
            {selectedOption.label}
          </span>
          <svg
            className={`w-3 h-3 transition-transform duration-75 ${isOpen ? "rotate-180 text-foreground" : "text-muted-foreground/70"}`}
            viewBox="0 0 48 48"
          >
            <path fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="8" d="M36 19L24 31L12 19z" />
          </svg>
        </div>
      </div>
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute w-40 left-0 z-50 py-2.5 px-2 mt-3 -ml-2 top-full bg-background text-background-foreground rounded-2xl shadow-xl/20 border border-border overflow-hidden">
          <div className="space-y-1">
            {TAB_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-center pl-3 pr-8 py-2 rounded-lg text-sm cursor-pointer ${option.value === initTabParams ? "bg-primary text-primary-foreground" : "text-popover-foreground hover:bg-foreground/5"
                  }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.icon && <option.icon className="w-4 h-4 mr-3" />}
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}