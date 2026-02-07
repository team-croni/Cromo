"use client";

import MainLayout from "@components/layout/main-layout";
import { EditorWrapper } from "@components/editor/editor-wrapper";
import { MemoBrowserWrapper } from "@components/memo/memo-browser-wrapper";
import { MemoGridView } from "@components/memo/memo-grid-view";
import { useFolders } from "@hooks/useFolders";
import { redirect, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Ring } from "ldrs/react";

export function MemoLayoutClient() {
  const [memoBrowserWidth, setMemoBrowserWidth] = useState(400);
  const memoBrowserRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');
  const tab = searchParams.get('tab');
  const memoId = searchParams.get('id');
  const { loading } = useFolders();
  const { status } = useSession();

  const isMemoBrowserOpen = (tab || folderId) && !loading
  const isGridView = !tab && !folderId && !memoId;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !memoBrowserRef.current) return;

    const rect = memoBrowserRef.current.getBoundingClientRect();
    const newWidth = Math.max(400, Math.min(e.clientX - rect.left, 700));
    setMemoBrowserWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'auto';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if (status === "loading") {
    return (
      <MainLayout>
        <div className="flex-1 flex h-[calc(100vh-4rem)] md:h-screen items-center justify-center">
          <Ring
            size="28"
            speed="2"
            stroke={3}
            color="var(--color-foreground)"
            bgOpacity={0.2}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-screen">
        <div className={`flex flex-col z-25 will-change-transform transition-all ${isMemoBrowserOpen ? '' : 'absolute h-[calc(100vh-4rem)] md:h-full -translate-x-full opacity-0 pointer-events-none'}`}>
          <div
            ref={memoBrowserRef}
            className="w-full! max-w-full! md:max-w-auto md:w-auto flex-1 h-[calc(100vh-4rem)] md:h-full bg-background border-r-3 border-border/30 flex-col transition-all duration-50 ease-linear fixed md:relative md:flex"
            style={{ width: `${memoBrowserWidth}px`, minWidth: '400px', maxWidth: '700px' }}
          >
            <MemoBrowserWrapper />
            <div
              className={`hidden md:block group absolute -right-1.25 top-0 bottom-0 w-1.5 transition-colors duration-150 cursor-col-resize`}
              onMouseDown={startResizing}
            >
              <div className={`w-1 h-full group-hover:bg-primary ${isResizing ? 'bg-primary/50' : 'bg-transparent'} duration-150 absolute left-1/2 transform -translate-1/2 top-1/2`}></div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {isGridView ? (
            <MemoGridView />
          ) : (
            <EditorWrapper />
          )}
        </div>
      </div>
    </MainLayout>
  );
}