"use client";

import { useEffect } from "react";
import { useFolderExpansion } from "@hooks/useFolderExpansion";
import { MemoBrowserHeader } from "@components/memo/memo-browser-header";
import { MemoBrowserSelectionInfo } from "@components/memo/memo-browser-selection-info";
import { MemoBrowserFilterSection } from "@components/memo/memo-browser-filter-section";
import { MemoBrowserContent } from "@components/memo/memo-browser-content";
import { useMemoBrowserStore } from '@store/memoBrowserStore';

export function MemoBrowser() {
  const { activeMode, setActiveMode } = useMemoBrowserStore();

  // ESC 키 이벤트 처리
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && activeMode === 'selection') {
        setActiveMode('none');
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeMode, setActiveMode]);

  useFolderExpansion();

  return (
    <div className="h-full flex flex-col">
      <div className="bg-background">
        <MemoBrowserHeader />
        <MemoBrowserFilterSection />
        <MemoBrowserSelectionInfo />
      </div>

      {/* Content Area */}
      <div className="relative flex-1 overflow-hidden">
        <MemoBrowserContent />
      </div>
    </div>
  );
}