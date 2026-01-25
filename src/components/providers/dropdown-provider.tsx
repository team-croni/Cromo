'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';

export interface DropdownOption {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface DropdownPosition {
  top: number;
  left: number;
  width?: number;
  height?: number;
}

export interface DropdownConfig {
  id: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  content: ReactNode;
  position: DropdownPosition;
  onClose?: () => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
  zIndex?: number;
}

export interface ModalConfig {
  id: string;
  content: ReactNode;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  zIndex?: number;
}

interface DropdownContextValue {
  openDropdown: (config: DropdownConfig) => void;
  closeDropdown: (id?: string) => void;
  isDropdownOpen: (id: string) => boolean;
  activeDropdownId: string | null;
  updateDropdownPosition: (id: string, position: DropdownPosition) => void;
  openModal: (config: ModalConfig) => void;
  closeModal: (id?: string) => void;
  isModalOpen: (id: string) => boolean;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

interface DropdownProviderProps {
  children: ReactNode;
}

export const DropdownProvider: React.FC<DropdownProviderProps> = ({ children }) => {
  const [dropdowns, setDropdowns] = useState<Map<string, DropdownConfig>>(new Map());
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [modals, setModals] = useState<Map<string, ModalConfig>>(new Map());
  const dropdownIdCounter = useRef(0);
  const dialogIdCounter = useRef(0);
  const modalIdCounter = useRef(0);

  const openDropdown = useCallback((config: DropdownConfig) => {
    const id = config.id || `dropdown_${dropdownIdCounter.current++}`;

    setDropdowns(prev => {
      const newDropdowns = new Map(prev);
      // 기존 드롭다운들 닫기
      newDropdowns.forEach(dropdown => {
        dropdown.onClose?.();
      });
      newDropdowns.clear();

      // 새로운 드롭다운 추가
      newDropdowns.set(id, { ...config, id });
      return newDropdowns;
    });

    setActiveDropdownId(id);
  }, []);

  const closeDropdown = useCallback((id?: string) => {
    if (id) {
      setDropdowns(prev => {
        const newDropdowns = new Map(prev);
        const dropdown = newDropdowns.get(id);
        if (dropdown) {
          dropdown.onClose?.();
          newDropdowns.delete(id);
        }
        return newDropdowns;
      });

      if (activeDropdownId === id) {
        setActiveDropdownId(null);
      }
    } else {
      // 모든 드롭다운 닫기
      setDropdowns(prev => {
        prev.forEach(dropdown => {
          dropdown.onClose?.();
        });
        return new Map();
      });
      setActiveDropdownId(null);
    }
  }, [activeDropdownId]);

  const isDropdownOpen = useCallback((id: string) => {
    return dropdowns.has(id) && activeDropdownId === id;
  }, [dropdowns, activeDropdownId]);

  const updateDropdownPosition = useCallback((id: string, position: DropdownPosition) => {
    setDropdowns(prev => {
      const newDropdowns = new Map(prev);
      const existingDropdown = newDropdowns.get(id);
      if (existingDropdown) {
        newDropdowns.set(id, { ...existingDropdown, position });
      }
      return newDropdowns;
    });
  }, []);

  // Modal 관리 메서드들
  const openModal = useCallback((config: ModalConfig) => {
    const id = config.id || `modal_${modalIdCounter.current++}`;
    setModals(prev => new Map(prev).set(id, { ...config, id }));
  }, []);

  const closeModal = useCallback((id?: string) => {
    if (id) {
      setModals(prev => {
        const newModals = new Map(prev);
        const modal = newModals.get(id);
        if (modal) {
          modal.onClose?.();
          newModals.delete(id);
        }
        return newModals;
      });
    } else {
      // 모든 모달 닫기
      setModals(prev => {
        prev.forEach(modal => modal.onClose?.());
        return new Map();
      });
    }
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals.has(id);
  }, [modals]);

  // Esc 키로 드롭다운, 다이얼로그, 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
        const lastModalId = Array.from(modals.keys()).pop();
        if (lastModalId) {
          const modal = modals.get(lastModalId);
          if (modal?.closeOnEscape !== false) {
            closeModal(lastModalId);
          }
        }
      }
    };

    if (activeDropdownId || modals.size > 0) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeDropdownId, modals, closeDropdown, closeModal]);

  // 클릭 외부 감지로 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeDropdownId) return;

      const dropdown = dropdowns.get(activeDropdownId);
      if (!dropdown) return;

      const target = event.target as Node;
      const triggerElement = dropdown.triggerRef.current as HTMLElement;

      // 트리거 요소나 드롭다운 콘텐츠 클릭 시 닫지 않음
      if (triggerElement?.contains(target)) {
        return;
      }

      // 드롭다운 영역 클릭 확인
      const dropdownElement = document.getElementById(`dropdown-content-${activeDropdownId}`);
      if (dropdownElement?.contains(target)) {
        return;
      }

      closeDropdown(activeDropdownId);
    };

    if (activeDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeDropdownId, dropdowns, closeDropdown]);

  const contextValue: DropdownContextValue = {
    openDropdown,
    closeDropdown,
    isDropdownOpen,
    activeDropdownId,
    updateDropdownPosition,
    openModal,
    closeModal,
    isModalOpen,
  };

  return (
    <DropdownContext.Provider value={contextValue}>
      {children}

      {/* 드롭다운 콘텐츠 렌더링 */}
      {Array.from(dropdowns.entries()).map(([id, config]) => (
        <div
          key={id}
          id={`dropdown-content-${id}`}
          className={`fixed bg-background border rounded-2xl shadow-xl/20 z-50 px-2 py-2.5 ${config.className || ''
            }`}
          style={{
            top: `${config.position.top}px`,
            left: `${config.position.left}px`,
            zIndex: config.zIndex || 50,
            minWidth: config.position.width ? `${config.position.width}px` : '200px',
            maxHeight: config.position.height ? `${config.position.height}px` : '300px',
          }}
        >
          {config.content}
        </div>
      ))}

      {/* 모달 렌더링 */}
      {Array.from(modals.entries()).map(([id, config]) => {
        const sizeClasses = {
          sm: 'max-w-sm',
          md: 'max-w-md',
          lg: 'max-w-2xl',
          xl: 'max-w-4xl',
        };

        return (
          <div
            key={id}
            id={`modal-${id}`}
            className={`fixed inset-0 z-${config.zIndex || 70} flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs fade-in`}
            style={{ zIndex: config.zIndex || 70 }}
            onClick={(e) => {
              if (config.closeOnOverlayClick !== false && e.target === e.currentTarget) {
                closeModal(id);
              }
            }}
          >
            <div className={`bg-background border rounded-2xl shadow-xl/15 w-full ${sizeClasses[config.size || 'md']} max-h-[90vh] overflow-hidden flex flex-col slide-up`}>
              <div className="flex-1 overflow-auto">
                {config.content}
              </div>
            </div>
          </div>
        );
      })}
    </DropdownContext.Provider>
  );
};

export const useDropdown = (): DropdownContextValue => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a DropdownProvider');
  }
  return context;
};

// 모달 전용 훅
export const useModal = () => {
  const { openModal, closeModal, isModalOpen } = useDropdown();
  return { openModal, closeModal, isModalOpen };
};

// 유틸리티 훅: 트리거 요소의 절대 위치 계산
export const useAbsolutePosition = <T extends HTMLElement>(triggerRef: React.RefObject<T | null>, config?: {
  align?: 'left' | 'right' | 'center';
  offset?: { x: number; y: number };
  maxWidth?: number;
  maxHeight?: number;
}) => {
  const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0 });

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const element = triggerRef.current as HTMLElement;

    const rect = element.getBoundingClientRect();
    const align = config?.align || 'left';
    const offset = config?.offset || { x: 0, y: 8 };
    const maxWidth = config?.maxWidth || 400;
    const maxHeight = config?.maxHeight || 400;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.left + offset.x;
    let top = rect.bottom + offset.y;

    // 정렬에 따른 가로 위치 조정
    switch (align) {
      case 'center':
        left = rect.left + (rect.width - maxWidth) / 2 + offset.x;
        break;
      case 'right':
        left = rect.right - maxWidth + offset.x;
        break;
      default:
        // left
        break;
    }

    // 화면 경계 고려하여 위치 조정
    if (left + maxWidth > viewportWidth - 10) {
      left = viewportWidth - maxWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    if (top + maxHeight > viewportHeight - 10) {
      top = rect.top - maxHeight - offset.y;
    }
    if (top < 10) {
      top = 10;
    }

    setPosition({
      top: Math.round(top),
      left: Math.round(left),
      width: maxWidth,
      height: maxHeight,
    });
  }, [triggerRef]);

  useEffect(() => {
    calculatePosition();

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [calculatePosition]);

  return position;
};