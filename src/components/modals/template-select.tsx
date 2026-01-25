"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { MEMO_TEMPLATES } from "@constants/templates";
import { useMemoBrowserStore } from "@store/memoBrowserStore";


export function TemplateSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const { selectedTemplate, setSelectedTemplate } = useMemoBrowserStore();

  const options = MEMO_TEMPLATES.map(template => ({
    value: template.id,
    label: template.name
  }));

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

  const selectedOption = options.find(option => option.value === selectedTemplate) || null;

  const handleSelect = (value: string) => {
    setSelectedTemplate(value);
    setIsOpen(false);
  };

  return (
    <div className="absolute flex items-center right-0 h-full">
      <div className="flex-1 h-full" ref={selectRef}>
        {isOpen &&
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={() => setIsOpen(false)}
          />
        }

        {/* Select trigger */}
        <div
          className="h-full p-1.5"
          onClick={(e) => setIsOpen(!isOpen)}
        >
          <div
            className={`flex items-center justify-end h-full pr-4 pl-6 text-sm border bg-foreground/5 hover:border-foreground/10 rounded-xl text-popover-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${isOpen ? 'border-foreground/10' : 'border-transparent'}`}
          >
            <span className={`flex-1 mr-3 text-end ${selectedOption ? "" : "text-muted-foreground"}`}>
              {selectedOption ? selectedOption.label : '템플릿 선택'}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-75 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute w-40 right-0 z-50 py-3 px-2 mt-2 bg-background text-background-foreground rounded-2xl shadow-xl/20 border border-border overflow-hidden">
            <div className="space-y-1">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={`pl-3 pr-8 py-2 rounded-md text-sm cursor-pointer ${option.value === selectedTemplate ? "bg-primary text-primary-foreground" : "text-popover-foreground hover:bg-foreground/5"
                    }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}