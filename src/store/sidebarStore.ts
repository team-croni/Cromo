import { create } from 'zustand';

interface SidebarStore {
  // 사이드바 열림/닫힘 상태 (모바일)
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleIsOpen: () => void;

  // 사이드바 접힘/펼침 상태 (데스크톱)
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  toggleIsCollapsed: () => void;

  // 현재 활성화된 링크
  activeHref: string;
  setActiveHref: (activeHref: string) => void;

  // 아바타 정보
  avatarColor?: string;
  avatarType?: "gradient" | "solid" | "image";
  setAvatarInfo: (avatarColor?: string, avatarType?: "gradient" | "solid" | "image") => void;

  // URL 파라미터와 함께 href 생성
  getHrefWithId: (baseHref: string) => string;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  // 초기 상태
  isOpen: false,
  isCollapsed: false,
  activeHref: '',
  avatarColor: undefined,
  avatarType: undefined,

  // 모바일 메뉴 상태 관리
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  // 데스크톱 접힘/펼침 상태 관리
  setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
  toggleIsCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

  // 활성 링크 설정
  setActiveHref: (activeHref) => set({ activeHref }),

  // 아바타 정보 설정
  setAvatarInfo: (avatarColor, avatarType) => set({ avatarColor, avatarType }),

  // URL 파라미터와 함께 href 생성
  getHrefWithId: (baseHref: string) => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return baseHref;

    try {
      const url = new URL(window.location.href);
      const id = url.searchParams.get('id');

      if (id) {
        const separator = baseHref.includes('?') ? '&' : '?';
        return `${baseHref}${separator}id=${id}`;
      }
      return baseHref;
    } catch {
      return baseHref;
    }
  },
}));