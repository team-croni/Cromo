import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSidebarStore } from "@/store/sidebarStore";

export function useSidebarState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
    activeHref,
    setActiveHref,
    getHrefWithId: getHrefWithIdStore,
  } = useSidebarStore();

  // 현재 활성화된 링크를 계산
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    const folderId = searchParams.get('folderId');
    if (pathname === '/memo') {
      if (folderId) {
        setActiveHref(`/memo?folderId=${folderId}`);
      } else if (currentTab === 'recent') {
        setActiveHref('/memo?tab=recent');
      } else if (currentTab === 'archived') {
        setActiveHref('/memo?tab=archived');
      } else if (currentTab === 'trash') {
        setActiveHref('/memo?tab=trash');
      } else if (currentTab === 'shared') {
        setActiveHref('/memo?tab=shared');
      } else {
        setActiveHref('/memo');
      }
    } else {
      setActiveHref(pathname);
    }
  }, [pathname, searchParams, setActiveHref]);

  // URL 파라미터와 함께 새로운 href를 생성하는 함수 (searchParams의 id만 고려)
  const getHrefWithId = (baseHref: string) => {
    const id = searchParams.get('id');

    if (baseHref !== '/memo' && id) {
      const separator = baseHref.includes('?') ? '&' : '?';
      return `${baseHref}${separator}id=${id}`;
    }
    return baseHref;
  };

  return {
    pathname,
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
    activeHref,
    getHrefWithId,
  };
}