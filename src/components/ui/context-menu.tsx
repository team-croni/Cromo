"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuOption {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  color?: string;
  type?: 'item' | 'separator';
}

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
  dataTestid?: string;
}

export function ContextMenu({ isOpen, x, y, options, onClose, dataTestid }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
      const PADDING = 8;

      let adjustedX = x;
      if (x + menuWidth > windowWidth - PADDING) {
        adjustedX = windowWidth - menuWidth - PADDING;
      }
      if (adjustedX < PADDING) {
        adjustedX = PADDING;
      }

      let adjustedY = y;
      if (y + menuHeight > windowHeight - PADDING) {
        adjustedY = windowHeight - menuHeight - PADDING;
      }
      if (adjustedY < PADDING) {
        adjustedY = PADDING;
      }
      
      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [isOpen, x, y]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const menuElement = (
    <div
      data-testid={dataTestid}
      className={`fixed inset-0 flex items-center justify-center z-100 transition-opacity ${isOpen ? '' : 'opacity-0 pointer-events-none'}`}>
      <div
        ref={menuRef}
        className={`fixed z-100 min-w-45 bg-background text-foreground rounded-2xl shadow-xl/20 border px-2 py-2.5 space-y-1 transition-transform ${isOpen ? '' : 'opacity-0 pointer-events-none translate-y-2.5'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {options.map((option, index) => {
          // 구분선인 경우
          if (option.type === 'separator') {
            return (
              <div
                key={index}
                className="h-px bg-border mx-1 my-2"
              />
            );
          }

          // 일반 메뉴 아이템인 경우
          return (
            <button
              key={index}
              className={`flex items-center w-full pl-3 pr-8 py-2 rounded-lg text-left text-sm ${option.color ? `text-${option.color}` : ''} hover:bg-foreground/5`}
              onClick={(e) => {
                e.stopPropagation();
                if (option.action) {
                  option.action();
                }
                onClose();
              }}
            >
              {option.icon && <span className="mr-3">{option.icon}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // 서버 사이드에서는 렌더링하지 않고 클라이언트에서만 포탈을 생성
  if (typeof window === 'undefined' || !mounted) {
    return null;
  }

  return createPortal(menuElement, document.body);
}